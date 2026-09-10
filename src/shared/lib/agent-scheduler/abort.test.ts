import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAbortHandler, type SchedulerAbortStore } from '@/shared/lib/agent-scheduler/abort';
import type { TaskReference } from '@/shared/lib/agent-scheduler/task-contract';

const ref: TaskReference = { kind: 'operation', id: 'a'.repeat(24), dispatchId: 'd'.repeat(64) };
const exact = { _id: ref.id, executionTarget: 'scheduler', dispatchId: ref.dispatchId };
interface Row { status: string; claimedBy?: string; result?: unknown }
const setup = (initial: Row | null) => {
  let row = initial;
  const updates: { filter: Record<string, unknown>; update: Record<string, unknown> }[] = [];
  let reads = 0;
  const store: SchedulerAbortStore = {
    update: async (kind, filter, update) => {
      assert.equal(kind, 'operation');
      assert.deepEqual({ _id: filter._id, executionTarget: filter.executionTarget, dispatchId: filter.dispatchId }, exact);
      updates.push({ filter, update });
      if (!row || row.status !== filter.status) return false;
      const condition = filter.claimedBy as { $regex: string } | undefined;
      if (condition && !new RegExp(condition.$regex).test(row.claimedBy ?? '')) return false;
      Object.assign(row, update.$set);
      return true;
    },
    find: async (kind, filter) => {
      assert.equal(kind, 'operation'); assert.deepEqual(filter, exact); reads += 1; return row;
    },
  };
  return { store, updates, read: () => ({ row, reads }), replace: (value: Row | null) => { row = value; } };
};

test('preparation failure atomically marks pending work failed before any running update or read', async () => {
  const { store, updates, read } = setup({ status: 'pending' });
  assert.deepEqual(await createAbortHandler(store)(ref, 'worker', 'preparation_failed'), { ok: true });
  assert.equal(read().row?.status, 'failed');
  assert.deepEqual(read().row?.result, { success: false, error: '작업 실행 준비에 실패했습니다. 서버 상태를 확인하세요.' });
  assert.equal(updates.length, 1); assert.equal(read().reads, 0);
  assert.deepEqual(updates[0].filter, { ...exact, status: 'pending' });
});

for (const code of ['preparation_failed', 'execution_uncertain'] as const) {
  test(`${code} quarantines running work owned by this worker without returning it to pending`, async () => {
    const { store, read } = setup({ status: 'running', claimedBy: 'scheduler:worker:lease' });
    assert.deepEqual(await createAbortHandler(store)(ref, 'worker', code), { ok: true });
    assert.equal(read().row?.status, 'needs_review');
    assert.deepEqual(read().row?.result, { success: false, requiresReview: true, error: '작업 실행 여부를 확인할 수 없습니다. 실제 결과를 확인하세요.' });
    assert.equal(read().reads, 0);
  });
}

test('a simultaneous claim between updates is safely quarantined for the same worker', async () => {
  const fixture = setup({ status: 'pending' });
  const original = fixture.store.update;
  fixture.store.update = async (kind, filter, update) => {
    if (filter.status === 'pending') fixture.replace({ status: 'running', claimedBy: 'scheduler:worker:lease' });
    return original(kind, filter, update);
  };
  assert.deepEqual(await createAbortHandler(fixture.store)(ref, 'worker', 'execution_uncertain'), { ok: true });
  assert.equal(fixture.read().row?.status, 'needs_review');
});

for (const status of ['done', 'failed', 'needs_review']) {
  test(`terminal ${status} and its original result are preserved`, async () => {
    const row = { status, claimedBy: 'scheduler:other:lease', result: { success: true, original: 'result' } };
    const expected = structuredClone(row);
    const { store } = setup(row);
    assert.deepEqual(await createAbortHandler(store)(ref, 'worker', 'execution_uncertain'), { ok: true });
    assert.deepEqual(row, expected);
  });
}

test('another worker or a regex-lookalike cannot be aborted', async () => {
  for (const claimedBy of ['scheduler:other:lease', 'scheduler:worker.extra:lease', 'scheduler:workerX1:lease']) {
    const row = { status: 'running', claimedBy };
    const { store } = setup(row);
    await assert.rejects(createAbortHandler(store)(ref, 'worker.1', 'execution_uncertain'), { status: 409, code: 'lease_lost' });
    assert.equal(row.status, 'running');
  }
  const { store, read } = setup({ status: 'running', claimedBy: 'scheduler:worker.1:lease' });
  await createAbortHandler(store)(ref, 'worker.1', 'execution_uncertain');
  assert.equal(read().row?.status, 'needs_review');
});

test('a concurrent terminal result wins over the abort report', async () => {
  const fixture = setup({ status: 'running', claimedBy: 'scheduler:worker:lease' });
  const original = fixture.store.update;
  fixture.store.update = async (kind, filter, update) => {
    if (filter.status === 'running') fixture.replace({ status: 'done', result: { success: true } });
    return original(kind, filter, update);
  };
  await createAbortHandler(fixture.store)(ref, 'worker', 'execution_uncertain');
  assert.deepEqual(fixture.read().row, { status: 'done', result: { success: true } });
});

test('missing exact scheduler task returns 404 and invalid inputs never reach storage', async () => {
  const { store, updates } = setup(null);
  const abort = createAbortHandler(store);
  await assert.rejects(abort(ref, 'worker', 'execution_uncertain'), { status: 404, code: 'task_not_found' });
  const count = updates.length;
  await assert.rejects(abort(ref, 'worker:injected', 'execution_uncertain'), { status: 400 });
  await assert.rejects(abort({ ...ref, dispatchId: 'bad' }, 'worker', 'execution_uncertain'), { status: 400 });
  await assert.rejects(abort(ref, 'worker', 'bad' as 'execution_uncertain'), { status: 400 });
  assert.equal(updates.length, count);
});

test('action abort uses its exact 64-character task identity without caller-supplied ownership', async () => {
  const actionRef: TaskReference = { kind: 'action', id: 'b'.repeat(64), dispatchId: 'c'.repeat(64) };
  const filters: Record<string, unknown>[] = [];
  const abort = createAbortHandler({
    update: async (kind, filter) => { assert.equal(kind, 'action'); filters.push(filter); return true; },
    find: async () => { throw new Error('Pending abort must not read'); },
  });
  assert.deepEqual(await abort(actionRef, 'worker', 'preparation_failed'), { ok: true });
  assert.deepEqual(filters, [{ _id: actionRef.id, executionTarget: 'scheduler', dispatchId: actionRef.dispatchId, status: 'pending' }]);
});

test('concurrent and repeated aborts preserve the first terminal result', async () => {
  const { store, read } = setup({ status: 'pending' });
  const abort = createAbortHandler(store);
  assert.deepEqual(await Promise.all([
    abort(ref, 'worker', 'preparation_failed'), abort(ref, 'worker', 'execution_uncertain'),
  ]), [{ ok: true }, { ok: true }]);
  assert.deepEqual(read().row, { status: 'failed', result: { success: false, error: '작업 실행 준비에 실패했습니다. 서버 상태를 확인하세요.' } });
  const before = structuredClone(read().row);
  await abort(ref, 'another-worker', 'execution_uncertain');
  assert.deepEqual(read().row, before);
});
