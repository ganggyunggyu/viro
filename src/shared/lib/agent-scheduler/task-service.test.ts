import assert from 'node:assert/strict';
import test from 'node:test';
import { runSchedulerTask, type SchedulerTaskDependencies } from './task-service';
import { LEASE_MS, ownerScope, type SchedulerTask } from './task-contract';

const ref = { kind: 'operation' as const, id: 'a'.repeat(24), dispatchId: 'd'.repeat(64) };
const fixture = () => {
  let now = new Date('2026-09-07T00:00:00Z');
  let row: SchedulerTask = { ...ref, userId: 'owner-from-db', status: 'pending', operation: { type: 'write_comment', accountId: 'owned', cafeId: '123', articleId: 1, content: 'test' } };
  let contexts = 0;
  const matches = (r: typeof ref) => r.id === row.id && r.dispatchId === row.dispatchId && r.kind === row.kind;
  const live = (key: string, cutoff: Date) => row.status === 'running' && row.claimedBy === key && Number(row.claimedAt) >= Number(cutoff);
  const dependencies: SchedulerTaskDependencies = { now: () => now, store: {
    find: async (r) => matches(r as typeof ref) ? { ...row } : null,
    claim: async (r, key, at) => { if (!matches(r as typeof ref) || row.status !== 'pending') return null; row = { ...row, status: 'running', claimedBy: key, claimedAt: at }; return { ...row }; },
    expire: async (_, cutoff) => { if (row.status === 'running' && Number(row.claimedAt) < Number(cutoff)) row.status = 'needs_review'; },
    renew: async (_, key, cutoff, at) => { if (!live(key, cutoff)) return false; row.claimedAt = at; return true; },
    finish: async (_, key, cutoff, status, result) => { if (!live(key, cutoff)) return false; row.status = status as SchedulerTask['status']; row.result = result; return true; },
  }, context: async () => { contexts++; return { accounts: [{ accountId: 'owned', password: 'test-only' }], cafes: [{ cafeId: '123', cafeUrl: 'owned', name: 'Owned' }] }; }, sync: async () => ({ ok: true }), prepare: async () => ({}) };
  const run = (verb: Parameters<typeof runSchedulerTask>[2], body: Record<string, unknown> = {}, r = ref) => runSchedulerTask(dependencies, r, verb, { dispatchId: r.dispatchId, ...body });
  return { run, get row() { return row; }, get contexts() { return contexts; }, advance: (ms: number) => { now = new Date(Number(now) + ms); } };
};

test('authorize derives only owner hash; wrong dispatch cannot return credentials', async () => {
  const f = fixture();
  assert.deepEqual(await f.run('authorize'), { authorized: true, ownerScope: ownerScope('owner-from-db') });
  assert.equal(f.contexts, 0);
  await assert.rejects(f.run('authorize', {}, { ...ref, dispatchId: 'f'.repeat(64) }), /task_not_found/);
  assert.equal(f.contexts, 0);
});

test('simultaneous claims permit only one execution; completed task never claims again', async () => {
  const f = fixture();
  const claims = await Promise.all([f.run('claim', { workerId: 'w1' }), f.run('claim', { workerId: 'w1' })]) as Array<{ claimed: { leaseId: string; ownerScope: string } | null }>;
  assert.equal(claims.filter(({ claimed }) => claimed).length, 1);
  const claimed = claims.find((r) => r.claimed)!.claimed!;
  assert.equal(claimed.ownerScope, ownerScope('owner-from-db'));
  assert.equal(f.contexts, 1);
  const lease = { workerId: 'w1', leaseId: claimed.leaseId };
  assert.deepEqual(await f.run('result', { ...lease, result: { success: true, commentId: '123' } }), { ok: true });
  assert.deepEqual(await f.run('claim', { workerId: 'w2' }), { claimed: null });
  assert.deepEqual(await f.run('result', { ...lease, result: { success: true, commentId: '123' } }), { ok: true });
  await assert.rejects(f.run('result', { ...lease, result: { success: true, commentId: '124' } }), /lease_lost/);
});

test('wrong worker and expired lease block credentials, heartbeat and late success', async () => {
  const f = fixture();
  const { claimed } = await f.run('claim', { workerId: 'w1' }) as { claimed: { leaseId: string } };
  await assert.rejects(f.run('context', { workerId: 'other', leaseId: claimed.leaseId }), /lease_lost/);
  f.advance(LEASE_MS + 1);
  const lease = { workerId: 'w1', leaseId: claimed.leaseId };
  await assert.rejects(f.run('heartbeat', lease), /lease_lost/);
  await assert.rejects(f.run('context', lease), /lease_lost/);
  await assert.rejects(f.run('result', { ...lease, result: { success: true } }), /lease_lost/);
  assert.equal(f.row.status, 'needs_review');
  assert.equal(f.contexts, 1);
});

test('scheduler persists classified failure copy and keeps uncertain outcomes ahead of nested authentication errors', async () => {
  for (const requiresReview of [false, true]) {
    const f = fixture();
    const { claimed } = await f.run('claim', { workerId: 'w1' }) as { claimed: { leaseId: string } };
    await f.run('result', { workerId: 'w1', leaseId: claimed.leaseId, result: { success: false, ...(requiresReview ? { requiresReview: true } : {}), error: '캡차 풀이 실패: password=synthetic-secret-256' } });
    assert.equal(f.row.status, requiresReview ? 'needs_review' : 'failed');
    const result = f.row.result as { errorCode: string; error: string };
    assert.equal(result.errorCode, requiresReview ? 'result_unverified' : 'captcha_required');
    assert.equal(result.error, requiresReview ? '작업 결과를 확인하지 못했습니다. 재요청 전에 카페에서 실제 결과를 확인해 주세요.' : '보안문자 인증을 완료하지 못해 작업을 중단했습니다.');
    assert.doesNotMatch(JSON.stringify(f.row.result), /synthetic-secret|password=/);
  }
});
