import assert from 'node:assert/strict';
import test from 'node:test';
import { runSyncReceipt, type SyncReceipt, type SyncReceiptStore } from './sync-receipt';

const ref = { kind: 'action' as const, id: 'a'.repeat(64), dispatchId: 'd'.repeat(64) };
const fixture = (failComplete = false) => {
  let receipt: SyncReceipt | null = null;
  let calls = 0;
  const store: SyncReceiptStore = {
    begin: async () => { if (receipt) return false; receipt = { status: 'running' }; return true; },
    read: async () => receipt,
    complete: async (_, __, ___, result) => { if (failComplete) throw new Error('test persistence failure'); receipt = { status: 'done', result }; return true; },
    uncertain: async () => { receipt = { status: 'uncertain' }; },
  };
  return { run: () => runSyncReceipt(store, ref, 'lease', 'article-published', { articleId: 1 }, async () => { calls++; return { ok: true }; }), get calls() { return calls; }, get receipt() { return receipt; } };
};
test('identical sync retries return durable receipt without applying effects twice', async () => {
  const f = fixture();
  assert.deepEqual(await f.run(), { ok: true });
  assert.deepEqual(await f.run(), { ok: true });
  assert.equal(f.calls, 1);
});
test('sync effect succeeded but receipt failed remains uncertain and never repeats', async () => {
  const f = fixture(true);
  await assert.rejects(f.run(), /sync_uncertain/);
  await assert.rejects(f.run(), /sync_uncertain/);
  assert.equal(f.calls, 1);
  assert.equal(f.receipt?.status, 'uncertain');
});
