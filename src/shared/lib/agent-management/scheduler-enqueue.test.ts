import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test, type TestContext } from 'node:test';
import mongoose from 'mongoose';
import { enqueueAgentOperation } from '@/shared/lib/agent-management/operations';
import { enqueueAction, prepareAction } from '@/shared/lib/agent-management/action-store';
import { Account, Cafe, AgentOperation, WorkerHeartbeat } from '@/shared/models';
import { AgentAction } from '@/shared/models/agent-action';

const setup = (context: TestContext) => {
  const cache = global.mongooseCache!;
  const previous = { ...cache };
  const descriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
  cache.conn = mongoose;
  const { VIRO_SCHEDULER_URL: url, VIRO_SCHEDULER_SERVICE_SECRET: secret } = process.env;
  delete process.env.VIRO_SCHEDULER_URL;
  delete process.env.VIRO_SCHEDULER_SERVICE_SECRET;
  context.after(() => {
    Object.assign(cache, previous);
    if (descriptor) Object.defineProperty(mongoose.connection, 'readyState', descriptor);
    else Reflect.deleteProperty(mongoose.connection, 'readyState');
    if (url === undefined) delete process.env.VIRO_SCHEDULER_URL;
    else process.env.VIRO_SCHEDULER_URL = url;
    if (secret === undefined) delete process.env.VIRO_SCHEDULER_SERVICE_SECRET;
    else process.env.VIRO_SCHEDULER_SERVICE_SECRET = secret;
  });
  const blocked = () => { throw new Error('Unexpected external access'); };
  context.mock.method(mongoose, 'connect', blocked);
  context.mock.method(mongoose.Query.prototype, 'exec', blocked);
  const fetch = context.mock.method(globalThis, 'fetch', blocked);
  const online = context.mock.method(WorkerHeartbeat, 'exists', async () => null);
  context.mock.method(Account, 'exists', async () => ({ _id: 'account' }));
  context.mock.method(Cafe, 'exists', async () => ({ _id: 'cafe' }));
  context.mock.method(Account, 'countDocuments', async () => 1);
  context.mock.method(Cafe, 'countDocuments', async () => 0);
  return { fetch, online };
};

const operation = { type: 'write_comment', accountId: 'naver', cafeId: '1', articleId: 1, content: 'comment' };
const action = { type: 'account-login', accountId: 'naver' };

for (const kind of ['operation', 'action'] as const) {
  test(`${kind} validated enqueue persists a new scheduler outbox while all workers are offline`, async (context) => {
    const { fetch, online } = setup(context);
    const model = kind === 'operation' ? AgentOperation : AgentAction;
    context.mock.method(model, 'findOne', () => ({ lean: async () => null }));
    const created: Record<string, unknown>[] = [];
    context.mock.method(model, 'create', async (input: Record<string, unknown>) => {
      const row = { ...input, status: 'pending', createdAt: new Date(), updatedAt: new Date() };
      created.push(row);
      return { toObject: () => row };
    });
    const result = kind === 'operation'
      ? await enqueueAgentOperation('owner', 'request-1', operation)
      : await enqueueAction('owner', 'request-1', action);
    assert.equal(result.replayed, false);
    assert.equal(created.length, 1);
    assert.equal(created[0].executionTarget, 'scheduler');
    assert.match(String(created[0].dispatchId), /^[a-f0-9]{64}$/);
    assert.equal(created[0].dispatchState, 'pending');
    assert.equal(created[0].dispatchAttempts, 0);
    assert.equal(created[0].deliveredAt, undefined);
    const view = 'operation' in result ? result.operation : result.task;
    assert.equal(view.executionTarget, 'scheduler');
    assert.equal(online.mock.callCount(), 0);
    assert.equal(fetch.mock.callCount(), 0);
  });

  test(`${kind} legacy idempotent replay never migrates or dispatches`, async (context) => {
    const { fetch } = setup(context);
    const model = kind === 'operation' ? AgentOperation : AgentAction;
    const input = kind === 'operation' ? operation : action;
    const legacy = {
      _id: 'a'.repeat(kind === 'operation' ? 24 : 64), userId: 'owner',
      fingerprint: createHash('sha256').update(JSON.stringify(input)).digest('hex'),
      ...(kind === 'operation' ? input : { action: input }),
      status: 'pending', createdAt: new Date(), updatedAt: new Date(),
    };
    const before = structuredClone(legacy);
    context.mock.method(model, 'findOne', () => ({ lean: async () => legacy }));
    const result = kind === 'operation'
      ? await enqueueAgentOperation('owner', 'request-1', input)
      : await enqueueAction('owner', 'request-1', input);
    assert.equal(result.replayed, true);
    assert.deepEqual(legacy, before);
    assert.equal(fetch.mock.callCount(), 0);
  });
}

test('action preparation validates resources without an online worker requirement', async (context) => {
  const { online } = setup(context);
  assert.deepEqual(await prepareAction('owner', action), action);
  assert.equal(online.mock.callCount(), 0);
});

for (const kind of ['operation', 'action'] as const) {
  for (const response of [202, 503, 'offline'] as const) {
    test(`${kind} persists before dispatch and remains accepted after ${response}`, async (context) => {
      setup(context);
      process.env.VIRO_SCHEDULER_URL = 'https://scheduler.example';
      process.env.VIRO_SCHEDULER_SERVICE_SECRET = 's'.repeat(32);
      const model = kind === 'operation' ? AgentOperation : AgentAction;
      const events: string[] = [];
      context.mock.method(model, 'findOne', () => ({ lean: async () => null }));
      context.mock.method(model, 'create', async (input: Record<string, unknown>) => {
        events.push('persist');
        return { toObject: () => ({ ...input, status: 'pending', createdAt: new Date(), updatedAt: new Date() }) };
      });
      context.mock.method(model, 'updateOne', async (_filter: unknown, update: { $inc?: unknown }) => {
        events.push(update.$inc ? 'attempt' : 'delivered'); return { matchedCount: 1 };
      });
      context.mock.method(globalThis, 'fetch', async () => {
        events.push('dispatch');
        if (response === 'offline') throw new Error('offline');
        return new Response(null, { status: response });
      });
      const result = kind === 'operation'
        ? await enqueueAgentOperation('owner', 'new-request', operation)
        : await enqueueAction('owner', 'new-request', action);
      assert.equal(result.replayed, false);
      assert.deepEqual(events, ['persist', 'attempt', 'dispatch', ...(response === 202 ? ['delivered'] : [])]);
    });
  }
}
