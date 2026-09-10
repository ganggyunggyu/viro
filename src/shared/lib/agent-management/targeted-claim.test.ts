import assert from 'node:assert/strict';
import { test } from 'node:test';
import { claimPendingTask, type PendingClaimStore, type TargetedClaim } from '@/shared/lib/agent-management/targeted-claim';

interface Row {
  id: string;
  userId: string;
  status: string;
  createdAt: number;
  executionTarget?: string;
  claimedBy?: string;
  claimedAt?: Date;
}

const createStore = (rows: Row[]) => {
  const calls: string[] = [];
  const store: PendingClaimStore<Row> = {
    prepare: async () => { calls.push('prepare'); },
    claim: async (filter, { $set: update }, options) => {
      calls.push('claim');
      assert.deepEqual(options, { sort: { createdAt: 1 }, new: true });
      const row = rows.toSorted((left, right) => left.createdAt - right.createdAt)
        .find(({ id, userId, status, executionTarget }) => userId === filter.userId && status === filter.status
          && (!filter._id || id === filter._id) && executionTarget !== filter.executionTarget?.$ne);
      if (!row) return null;
      Object.assign(row, update);
      return { ...row };
    },
  };
  return { store, calls };
};

for (const [kind, length] of [['operation', 24], ['action', 64]] as const) {
  const oldId = 'a'.repeat(length);
  const targetId = 'b'.repeat(length);
  const target: TargetedClaim = { kind, id: targetId };
  const pending = (id: string, createdAt = 1): Row => ({ id, userId: 'owner', status: 'pending', createdAt });

  test(`${kind} claim selects requested newer id and preserves older pending work`, async () => {
    const rows = [pending(oldId), pending(targetId, 2)];
    const { store, calls } = createStore(rows);
    const result = await claimPendingTask(store, 'owner', 'owner:token:worker', target);
    assert.equal(result?.id, targetId);
    assert.equal(result?.status, 'running');
    assert.equal(result?.claimedBy, 'owner:token:worker');
    assert.ok(result?.claimedAt instanceof Date);
    assert.equal(rows[0].status, 'pending');
    assert.deepEqual(calls, ['prepare', 'claim']);
  });

  test(`${kind} claim refuses a different owner and never falls back`, async () => {
    const rows = [pending(oldId), { ...pending(targetId), userId: 'other' }];
    const { store } = createStore(rows);
    assert.equal(await claimPendingTask(store, 'owner', 'worker', target), null);
    assert.ok(rows.every(({ status }) => status === 'pending'));
  });

  test(`${kind} claim refuses absent, running, done, failed, and uncertain ids without fallback`, async () => {
    for (const status of [undefined, 'running', 'done', 'failed', 'needs_review']) {
      const rows = [pending(oldId), ...(status ? [{ ...pending(targetId), status }] : [])];
      const { store } = createStore(rows);
      assert.equal(await claimPendingTask(store, 'owner', 'worker', target), null);
      assert.equal(rows[0].status, 'pending');
      if (status) assert.equal(rows[1].status, status);
    }
  });

  test(`${kind} concurrent claims atomically win once`, async () => {
    const { store } = createStore([pending(targetId)]);
    const results = await Promise.all(Array.from({ length: 8 }, (_, index) => claimPendingTask(store, 'owner', `worker-${index}`, target)));
    assert.equal(results.filter(Boolean).length, 1);
  });

  test(`${kind} malformed ids reject before any store call`, async () => {
    const { store, calls } = createStore([pending(oldId)]);
    for (const id of [undefined, null, '', 42, {}, targetId.toUpperCase(), 'g'.repeat(length), 'a'.repeat(length - 1), 'a'.repeat(length + 1), ` ${targetId}`, `${targetId}\n`]) {
      await assert.rejects(claimPendingTask(store, 'owner', 'worker', { kind, id }), { status: 400, code: 'invalid_request' });
    }
    assert.deepEqual(calls, []);
  });
}

test('generic polling retains oldest pending selection and owner scope', async () => {
  const rows = [
    { id: 'foreign', userId: 'other', status: 'pending', createdAt: 0 },
    { id: 'new', userId: 'owner', status: 'pending', createdAt: 2 },
    { id: 'old', userId: 'owner', status: 'pending', createdAt: 1 },
  ];
  const { store } = createStore(rows);
  assert.equal((await claimPendingTask(store, 'owner', 'worker'))?.id, 'old');
  assert.equal(rows[0].status, 'pending');
});

for (const [kind, length] of [['operation', 24], ['action', 64]] as const) {
  test(`${kind} scheduler tasks cannot be claimed by public generic or targeted workers`, async () => {
    const scheduler = { id: 'c'.repeat(length), userId: 'owner', status: 'pending', createdAt: 0, executionTarget: 'scheduler' };
    const legacy = { id: 'd'.repeat(length), userId: 'owner', status: 'pending', createdAt: 1 };
    const { store } = createStore([scheduler, legacy]);
    assert.equal(await claimPendingTask(store, 'owner', 'worker', { kind, id: scheduler.id }), null);
    assert.equal((await claimPendingTask(store, 'owner', 'worker'))?.id, legacy.id);
    assert.equal(scheduler.status, 'pending');
  });
}
