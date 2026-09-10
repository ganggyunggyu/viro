import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import mongoose from 'mongoose';
import { POST as claimOperation } from '@/app/api/agent/operations/[operationId]/claim/route';
import { POST as claimAction } from '@/app/api/agent/actions/[taskId]/claim/route';
import { GET as embedded } from '@/app/api/agent/embedded/route';
import { claimAgentOperationById } from '@/shared/lib/agent-management/operations';
import { claimActionById } from '@/shared/lib/agent-management/action-store';
import { AgentToken } from '@/shared/models/agent-token';
import { User } from '@/shared/models/user';
import { AgentOperation, WorkerHeartbeat } from '@/shared/models';
import { AgentAction } from '@/shared/models/agent-action';

const blockDatabase = (context: TestContext) => {
  const rejectAccess = () => { throw new Error('Database access is disabled in route tests'); };
  return [context.mock.method(mongoose, 'connect', rejectAccess), context.mock.method(mongoose.Query.prototype, 'exec', rejectAccess)];
};

const authenticateOwner = (context: TestContext) => {
  const cache = global.mongooseCache!;
  const previousCache = { ...cache };
  const readyState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
  cache.conn = mongoose;
  context.after(() => {
    Object.assign(cache, previousCache);
    if (readyState) Object.defineProperty(mongoose.connection, 'readyState', readyState);
    else Reflect.deleteProperty(mongoose.connection, 'readyState');
  });
  context.mock.method(AgentToken, 'findOne', () => ({ lean: async () => ({ _id: 'token-id', userId: 'owner', revoked: false }) }));
  context.mock.method(User, 'exists', async () => ({ _id: 'owner' }));
  return context.mock.method(AgentToken, 'updateOne', async () => ({ matchedCount: 1 }));
};

test('targeted routes and handshake reject missing authentication without database calls', async (context) => {
  const database = blockDatabase(context);
  for (const handler of [claimOperation, claimAction, embedded]) {
    const response = await handler(new Request('https://viro.example/api/agent/test'), {
      params: Promise.resolve({ operationId: 'a'.repeat(24), taskId: 'b'.repeat(64) }),
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'unauthorized', code: 'unauthorized' });
  }
  assert.ok(database.every(({ mock }) => mock.callCount() === 0));
});

test('explicit claim wrappers reject malformed and missing ids before database calls', async (context) => {
  const database = blockDatabase(context);
  for (const claim of [claimAgentOperationById, claimActionById]) {
    for (const id of [undefined, null, '', 'not-an-id']) {
      await assert.rejects(claim('owner', 'token', 'worker', id), { status: 400 });
    }
  }
  assert.ok(database.every(({ mock }) => mock.callCount() === 0));
});

test('authenticated handshake advertises the exact protocol privately without worker or task queries', async (context) => {
  const database = blockDatabase(context);
  const touchToken = authenticateOwner(context);
  const response = await embedded(new Request('https://viro.example/api/agent/embedded', {
    headers: { authorization: 'Bearer route-test-token' },
  }), undefined);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { protocol: 'viro-embedded-worker/1', claimById: true });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(touchToken.mock.callCount(), 1);
  assert.ok(database.every(({ mock }) => mock.callCount() === 0));
});

test('authenticated claim routes use the URL id, owner worker lease, and no fallback query', async (context) => {
  const database = blockDatabase(context);
  authenticateOwner(context);
  const operationClaim = context.mock.method(AgentOperation, 'findOneAndUpdate', () => ({ lean: async () => null }));
  const actionClaim = context.mock.method(AgentAction, 'findOneAndUpdate', () => ({ lean: async () => null }));
  const operationExpiry = context.mock.method(AgentOperation, 'updateMany', async () => ({ modifiedCount: 0 }));
  const actionExpiry = context.mock.method(AgentAction, 'updateMany', async () => ({ modifiedCount: 0 }));
  const heartbeat = context.mock.method(WorkerHeartbeat, 'updateOne', async () => ({ matchedCount: 1 }));
  const cases = [
    { handler: claimOperation, claim: operationClaim, expiry: operationExpiry, id: 'a'.repeat(24), kind: 'agent-operations', key: 'claimed' },
    { handler: claimAction, claim: actionClaim, expiry: actionExpiry, id: 'b'.repeat(64), kind: 'agent-actions-v1', key: 'task' },
  ];
  for (const { handler, claim, expiry, id, kind, key } of cases) {
    const request = () => new Request('https://viro.example/api/agent/test', {
      method: 'POST', headers: { authorization: 'Bearer route-test-token' }, body: JSON.stringify({ workerId: 'worker' }),
    });
    const response = await handler(request(), { params: Promise.resolve({ operationId: id, taskId: id }) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { [key]: null });
    assert.equal(claim.mock.callCount(), 1);
    const [filter, update] = claim.mock.calls[0].arguments;
    assert.deepEqual(filter, { userId: 'owner', status: 'pending', executionTarget: { $ne: 'scheduler' }, _id: id });
    assert.ok(update?.$set);
    assert.equal(update.$set.claimedBy, `${kind}:owner:token-id:worker`);
    assert.equal(update.$set.status, 'running');
    assert.ok(update.$set.claimedAt instanceof Date);
    const [expiryFilter, expiryUpdate] = expiry.mock.calls[0].arguments;
    assert.ok(expiryFilter && 'userId' in expiryFilter);
    assert.equal(expiryFilter.userId, 'owner');
    assert.ok(expiryUpdate && '$set' in expiryUpdate);
    assert.equal(expiryUpdate.$set?.status, 'needs_review');
    const invalid = await handler(request(), { params: Promise.resolve({ operationId: 'INVALID', taskId: 'INVALID' }) });
    assert.equal(invalid.status, 400);
    assert.equal(claim.mock.callCount(), 1);
    assert.equal(expiry.mock.callCount(), 1);
  }
  assert.equal(heartbeat.mock.callCount(), 2);
  assert.ok(database.every(({ mock }) => mock.callCount() === 0));
});
