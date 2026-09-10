import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmbeddedClient } from './client';
import { executeRequestedTask, type ExecutionDependencies } from './execution';

const id = 'a'.repeat(24);
const actionId = 'b'.repeat(64);
const claimed = {
  operation: { id, type: 'write_comment' as const, status: 'running' as const, accountId: 'writer', cafeId: '123', articleId: 1, content: '내용', createdAt: '', updatedAt: '' },
  account: { accountId: 'writer', password: 'private-password' }, cafe: { cafeId: '123', cafeUrl: 'fixture', name: '카페' },
};
const setup = () => {
  const calls: string[] = [];
  const client = createEmbeddedClient({ brokerUrl: 'https://viro.example', token: 'fixture', workerId: 'test', browsersPath: '/tmp/fixture', pollIntervalMs: 15000 }, (async () => { throw new Error('unexpected HTTP'); }) as typeof fetch);
  client.claimOperation = async (requested) => { calls.push(`claim:${requested}`); return claimed; };
  client.claimAction = async (requested) => { calls.push(`claim:${requested}`); return { id: actionId, status: 'running', action: { type: 'account-login', accountId: 'writer' } }; };
  client.operationHeartbeat = async () => { calls.push('lease'); return true; };
  client.actionHeartbeat = async () => { calls.push('lease'); return true; };
  client.reportOperation = async () => { calls.push('report'); return true; };
  client.reportAction = async () => { calls.push('report'); return true; };
  const dependencies: ExecutionDependencies = {
    client,
    operation: async () => { calls.push('write'); return { success: true, commentId: '10' }; },
    action: async () => { calls.push('write'); return { success: true }; },
  };
  return { dependencies, calls };
};

test('operation and action reuse claim → lease check → execute → report without fallback polling', async () => {
  for (const [kind, requested] of [['operation', id], ['action', actionId]] as const) {
    const { dependencies, calls } = setup();
    assert.deepEqual(await executeRequestedTask(kind, requested, () => true, dependencies), { kind, id: requested, claimed: true, reported: true });
    assert.deepEqual(calls, [`claim:${requested}`, 'lease', 'write', 'report']);
  }
});

test('already claimed or completed jobs return without any browser write', async () => {
  const { dependencies, calls } = setup();
  dependencies.client.claimOperation = async () => null;
  const result = await executeRequestedTask('operation', id, () => true, dependencies);
  assert.equal(result.claimed, false);
  assert.deepEqual(calls, []);
});

test('incorrect claimed ID or account cannot execute another pending operation', async () => {
  for (const response of [{ ...claimed, operation: { ...claimed.operation, id: 'c'.repeat(24) } }, { ...claimed, account: { ...claimed.account, accountId: 'other' } }]) {
    const { dependencies, calls } = setup();
    dependencies.client.claimOperation = async () => response;
    await assert.rejects(executeRequestedTask('operation', id, () => true, dependencies));
    assert.equal(calls.includes('write'), false);
  }
});

test('lost lease blocks external write; failed report does not rerun it', async () => {
  const { dependencies, calls } = setup();
  dependencies.client.operationHeartbeat = async () => false;
  await assert.rejects(executeRequestedTask('operation', id, () => true, dependencies));
  assert.equal(calls.includes('write'), false);
  dependencies.client.operationHeartbeat = async () => true;
  dependencies.client.reportOperation = async () => false;
  await assert.rejects(executeRequestedTask('operation', id, () => true, dependencies));
  assert.equal(calls.filter((call) => call === 'write').length, 1);
});

test('lease loss during a write reports uncertainty even when the executor returns success', async () => {
  const { dependencies } = setup();
  let ownsLease = true;
  dependencies.operation = async () => { ownsLease = false; return { success: true, commentId: '10' }; };
  dependencies.client.reportOperation = async (_, result) => {
    assert.equal(result.success, false);
    assert.equal(result.requiresReview, true);
    return true;
  };
  assert.equal((await executeRequestedTask('operation', id, () => ownsLease, dependencies)).reported, true);
});

test('lease loss after an account check stays uncertain and carries an explicit review marker', async () => {
  const { dependencies } = setup();
  let ownsLease = true;
  dependencies.action = async () => { ownsLease = false; return { success: true }; };
  dependencies.client.reportAction = async (_, result, uncertain) => {
    assert.equal(result.success, false);
    assert.equal((result as unknown as { requiresReview: boolean }).requiresReview, true);
    assert.equal(uncertain, true);
    return true;
  };
  assert.equal((await executeRequestedTask('action', actionId, () => ownsLease, dependencies)).reported, true);
});
