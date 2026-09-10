import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import mongoose from 'mongoose';
import { AgentOperation } from '@/shared/models';
import { AgentAction } from '@/shared/models/agent-action';
import { createSchedulerDispatch } from '@/shared/lib/agent-scheduler/outbox';
import { dispatchSchedulerTask, recoverSchedulerOutbox } from '@/shared/lib/agent-scheduler/outbox-store';

const setup = (context: TestContext) => {
  const cache = global.mongooseCache!;
  const previous = { ...cache };
  const descriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
  cache.conn = mongoose;
  const { VIRO_SCHEDULER_URL: url, VIRO_SCHEDULER_SERVICE_SECRET: secret } = process.env;
  process.env.VIRO_SCHEDULER_URL = 'https://scheduler.example';
  process.env.VIRO_SCHEDULER_SERVICE_SECRET = 's'.repeat(32);
  context.after(() => {
    Object.assign(cache, previous);
    if (descriptor) Object.defineProperty(mongoose.connection, 'readyState', descriptor);
    else Reflect.deleteProperty(mongoose.connection, 'readyState');
    if (url === undefined) delete process.env.VIRO_SCHEDULER_URL;
    else process.env.VIRO_SCHEDULER_URL = url;
    if (secret === undefined) delete process.env.VIRO_SCHEDULER_SERVICE_SECRET;
    else process.env.VIRO_SCHEDULER_SERVICE_SECRET = secret;
  });
  const block = () => { throw new Error('Unexpected database access'); };
  context.mock.method(mongoose, 'connect', block);
  context.mock.method(mongoose.Query.prototype, 'exec', block);
  return context.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 202 }));
};
const row = (id: string, createdAt = 1) => ({ _id: id, userId: 'owner', status: 'pending', createdAt: new Date(createdAt), ...createSchedulerDispatch() });
const pending = { executionTarget: 'scheduler', status: 'pending', dispatchState: 'pending' };

for (const kind of ['operation', 'action'] as const) {
  test(`${kind} dispatch increments and acknowledges only the exact pending scheduler document`, async (context) => {
    const fetch = setup(context);
    const model = kind === 'operation' ? AgentOperation : AgentAction;
    const doc = row('a'.repeat(kind === 'operation' ? 24 : 64));
    const updates = context.mock.method(model, 'updateOne', async () => ({ matchedCount: 1 }));
    assert.equal(await dispatchSchedulerTask(kind, doc), true);
    assert.equal(updates.mock.callCount(), 2);
    for (const { arguments: [filter] } of updates.mock.calls) assert.deepEqual(filter, { ...pending, _id: doc._id, dispatchId: doc.dispatchId });
    assert.deepEqual(updates.mock.calls[0].arguments[1], { $inc: { dispatchAttempts: 1 } });
    const acknowledgement = updates.mock.calls[1].arguments[1];
    assert.ok(acknowledgement && '$set' in acknowledgement);
    assert.equal(acknowledgement.$set?.dispatchState, 'delivered');
    assert.ok(acknowledgement.$set?.deliveredAt instanceof Date);
    assert.equal(fetch.mock.callCount(), 1);
  });
}

test('HTTP 202 after a concurrent claim cannot mark a running task delivered', async (context) => {
  setup(context);
  let attempts = 0;
  context.mock.method(AgentOperation, 'updateOne', async () => ({ matchedCount: ++attempts === 1 ? 1 : 0 }));
  assert.equal(await dispatchSchedulerTask('operation', row('a'.repeat(24))), false);
  assert.equal(attempts, 2);
});

test('recovery queries only pending scheduler outboxes, globally limits delivery, and quarantines stale scheduler leases', async (context) => {
  const fetch = setup(context);
  const expiredFilters: unknown[] = [];
  const scanned: { filter: unknown; limit: number }[] = [];
  const delivered: string[] = [];
  for (const [model, docs] of [
    [AgentOperation, [row('a'.repeat(24), 3), row('b'.repeat(24), 4)]],
    [AgentAction, [row('c'.repeat(64), 1), row('d'.repeat(64), 2)]],
  ] as const) {
    context.mock.method(model, 'find', (filter: unknown) => ({
      sort: (sort: unknown) => {
        assert.deepEqual(sort, { createdAt: 1 });
        return { limit: (limit: number) => { scanned.push({ filter, limit }); return { lean: async () => docs }; } };
      },
    }));
    context.mock.method(model, 'updateMany', async (filter: unknown, update: unknown) => {
      expiredFilters.push(filter);
      assert.deepEqual(update, { $set: { status: 'needs_review', result: { success: false, requiresReview: true, error: '작업 서버 응답이 끊겼습니다. 실제 결과 확인이 필요합니다.' } } });
      return { modifiedCount: 0 };
    });
    context.mock.method(model, 'updateOne', async (filter: { _id: string }, update: { $set?: unknown }) => {
      if (update.$set) delivered.push(filter._id);
      return { matchedCount: 1 };
    });
  }
  const before = Date.now();
  assert.deepEqual(await recoverSchedulerOutbox(2), { examined: 2, delivered: 2 });
  assert.deepEqual(scanned, [{ filter: pending, limit: 2 }, { filter: pending, limit: 2 }]);
  assert.deepEqual(delivered, ['c'.repeat(64), 'd'.repeat(64)]);
  assert.equal(fetch.mock.callCount(), 2);
  assert.equal(expiredFilters.length, 2);
  for (const value of expiredFilters) {
    const filter = value as { executionTarget: string; status: string; claimedAt: { $lt: Date } };
    assert.equal(filter.executionTarget, 'scheduler'); assert.equal(filter.status, 'running');
    assert.ok(filter.claimedAt.$lt.getTime() >= before - 30 * 60_000);
    assert.ok(filter.claimedAt.$lt.getTime() <= Date.now() - 30 * 60_000);
  }
});

test('invalid recovery limit is rejected before connecting or dispatching', async (context) => {
  const fetch = setup(context);
  await assert.rejects(recoverSchedulerOutbox(101), RangeError);
  assert.equal(fetch.mock.callCount(), 0);
});
