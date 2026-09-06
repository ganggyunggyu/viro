import assert from 'node:assert/strict';
import { test } from 'node:test';
import { processClaimedOperation } from './operation-runner';
import type { ClaimedOperation } from './operation-client';

const claimed: ClaimedOperation = {
  operation: { id: '123', type: 'write_comment', status: 'running', accountId: 'naver', cafeId: '1', articleId: 2, content: 'hello', createdAt: '', updatedAt: '' },
  account: { accountId: 'naver', password: 'never expose' },
  cafe: { cafeId: '1', cafeUrl: 'cafe', name: 'Cafe' },
};

test('does not execute when the claim is no longer owned', async () => {
  let executed = false;
  await assert.rejects(processClaimedOperation(claimed, { heartbeat: async () => false, report: async () => true }, async () => { executed = true; return { success: true }; }));
  assert.equal(executed, false);
});

test('report failure never repeats an external write', async () => {
  let count = 0;
  await assert.rejects(processClaimedOperation(claimed, { heartbeat: async () => true, report: async () => { throw new Error('network'); } }, async () => { count++; return { success: true, commentId: '5' }; }));
  assert.equal(count, 1);
});

test('execution errors become a safe result without credentials', async () => {
  let reported = '';
  await processClaimedOperation(claimed, { heartbeat: async () => true, report: async (_id, result) => { reported = JSON.stringify(result); return true; } }, async () => { throw new Error('never expose'); });
  assert.ok(reported.includes('false'));
  assert.ok(!reported.includes('never expose'));
});
