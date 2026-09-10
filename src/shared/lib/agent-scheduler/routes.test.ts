import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import mongoose from 'mongoose';
import { POST as taskRoute } from '@/app/api/agent/scheduler/tasks/[kind]/[id]/[verb]/route';
import { POST as workerRoute } from '@/app/api/agent/scheduler/worker/route';
import { POST as recoverRoute } from '@/app/api/agent/scheduler/outbox/recover/route';
import { AgentAction } from '@/shared/models/agent-action';
import { Account } from '@/shared/models/account';
import { WorkerHeartbeat } from '@/shared/models/worker-heartbeat';
import { signSchedulerRequest } from '@/shared/lib/agent-scheduler/service-auth';
import { ownerScope } from '@/shared/lib/agent-scheduler/task-contract';
import { schedulerExecutionStatus } from '@/shared/lib/agent-scheduler/worker';

const secret = 'route-test-service-secret-at-least32bytes';
const id = 'a'.repeat(64);
const dispatchId = 'b'.repeat(64);
const setup = (t: TestContext) => {
  const oldSecret = process.env.VIRO_SCHEDULER_SERVICE_SECRET;
  const oldUrl = process.env.VIRO_SCHEDULER_URL;
  process.env.VIRO_SCHEDULER_SERVICE_SECRET = secret;
  process.env.VIRO_SCHEDULER_URL = 'https://scheduler.invalid';
  const previous = { ...global.mongooseCache };
  const descriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
  global.mongooseCache!.conn = mongoose;
  t.after(() => {
    if (oldSecret === undefined) delete process.env.VIRO_SCHEDULER_SERVICE_SECRET; else process.env.VIRO_SCHEDULER_SERVICE_SECRET = oldSecret;
    if (oldUrl === undefined) delete process.env.VIRO_SCHEDULER_URL; else process.env.VIRO_SCHEDULER_URL = oldUrl;
    Object.assign(global.mongooseCache!, previous);
    if (descriptor) Object.defineProperty(mongoose.connection, 'readyState', descriptor); else Reflect.deleteProperty(mongoose.connection, 'readyState');
  });
  const denied = () => { throw new Error('unexpected database access'); };
  return [t.mock.method(mongoose, 'connect', denied), t.mock.method(mongoose.Query.prototype, 'exec', denied)];
};
const request = (verb: string, body: Record<string, unknown>, signed = true) => {
  const pathname = `/api/agent/scheduler/tasks/action/${id}/${verb}`;
  const raw = JSON.stringify(body);
  return new Request(`https://viro.invalid${pathname}`, { method: 'POST', body: raw, headers: signed ? signSchedulerRequest(secret, 'POST', pathname, raw) : {} });
};
const call = (verb: string, body: Record<string, unknown> = { dispatchId }) => taskRoute(request(verb, body), { params: Promise.resolve({ kind: 'action', id, verb }) });

test('all scheduler routes reject unsigned calls without data access', async (t) => {
  const blocked = setup(t);
  const a = await taskRoute(request('claim', { dispatchId, workerId: 'w' }, false), { params: Promise.resolve({ kind: 'action', id, verb: 'claim' }) });
  const b = await workerRoute(new Request('https://viro.invalid/api/agent/scheduler/worker', { method: 'POST', body: '{}' }), undefined);
  const c = await recoverRoute(new Request('https://viro.invalid/api/agent/scheduler/outbox/recover', { method: 'POST', body: '{}' }), undefined);
  for (const response of [a, b, c]) {
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'unauthorized', code: 'unauthorized' });
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
  assert.ok(blocked.every(({ mock }) => mock.callCount() === 0));
});

test('service rejects supplied owner and unknown verbs before data access', async (t) => {
  const blocked = setup(t);
  assert.equal((await call('authorize', { dispatchId, userId: 'other' })).status, 400);
  assert.equal((await call('constructor')).status, 404);
  assert.ok(blocked.every(({ mock }) => mock.callCount() === 0));
});

test('authorize and action claim use exact scheduler dispatch and derive owner hash', async (t) => {
  const blocked = setup(t);
  const row = { _id: id, dispatchId, executionTarget: 'scheduler', userId: 'database-owner', status: 'pending', action: { type: 'account-login', accountId: 'owned' } };
  t.mock.method(AgentAction, 'updateOne', async () => ({ matchedCount: 0 }));
  const find = t.mock.method(AgentAction, 'findOne', () => ({ lean: async () => row }));
  const claim = t.mock.method(AgentAction, 'findOneAndUpdate', (_filter: unknown, update: { $set: Record<string, unknown> }) => ({ lean: async () => ({ ...row, ...update.$set }) }));
  const response = await call('authorize');
  assert.deepEqual(await response.json(), { authorized: true, ownerScope: ownerScope('database-owner') });
  assert.deepEqual(find.mock.calls[0].arguments[0], { _id: id, executionTarget: 'scheduler', dispatchId });
  const claimed = await (await call('claim', { dispatchId, workerId: 'worker' })).json();
  assert.equal(claimed.claimed.ownerScope, ownerScope('database-owner'));
  assert.equal('userId' in claimed.claimed, false);
  assert.match(claimed.claimed.leaseId, /^[a-f0-9-]{36}$/);
  assert.deepEqual(claim.mock.calls[0].arguments[0], { _id: id, executionTarget: 'scheduler', dispatchId, status: 'pending' });
  assert.ok(blocked.every(({ mock }) => mock.callCount() === 0));
});

test('wrong lease blocks context before account queries', async (t) => {
  setup(t);
  const leaseId = '00000000-0000-4000-8000-000000000000';
  t.mock.method(AgentAction, 'updateOne', async () => ({ matchedCount: 0 }));
  t.mock.method(AgentAction, 'findOne', () => ({ lean: async () => ({ _id: id, dispatchId, executionTarget: 'scheduler', userId: 'owner', status: 'running', claimedBy: `scheduler:other:${leaseId}`, claimedAt: new Date(), action: { type: 'account-login', accountId: 'owned' } }) }));
  const accounts = t.mock.method(Account, 'find', () => { throw new Error('credentials must remain inaccessible'); });
  assert.equal((await call('context', { dispatchId, workerId: 'worker', leaseId })).status, 409);
  assert.equal(accounts.mock.callCount(), 0);
});

test('scheduler availability is global and separate from durable acceptance', async (t) => {
  setup(t);
  let filter: unknown;
  t.mock.method(WorkerHeartbeat, 'exists', async (value: unknown) => { filter = value; return null; });
  assert.deepEqual(await schedulerExecutionStatus(), { mode: 'scheduler', accepting: true, operationWorkerOnline: false, actionWorkerOnline: false });
  assert.ok(filter && typeof filter === 'object' && 'kind' in filter);
  assert.equal(filter.kind, 'viro-scheduler-v1');
  assert.equal('userId' in filter, false);
});

test('durable acceptance requires the same valid origin and secret as the outbox', async (t) => {
  setup(t);
  t.mock.method(WorkerHeartbeat, 'exists', async () => ({ _id: 'online' }));
  const configurations = [
    { url: '', key: secret }, { url: 'https://scheduler.invalid', key: 'short' },
    { url: 'http://external.invalid', key: secret }, { url: 'https://user:password@scheduler.invalid', key: secret },
    { url: 'https://scheduler.invalid/other', key: secret }, { url: 'https://scheduler.invalid?token=x', key: secret },
    { url: 'https://scheduler.invalid#fragment', key: secret }, { url: 'invalid', key: secret },
  ];
  for (const { url, key } of configurations) {
    process.env.VIRO_SCHEDULER_URL = url;
    process.env.VIRO_SCHEDULER_SERVICE_SECRET = key;
    assert.deepEqual(await schedulerExecutionStatus(), { mode: 'scheduler', accepting: false, operationWorkerOnline: true, actionWorkerOnline: true });
  }
  process.env.VIRO_SCHEDULER_URL = 'http://127.0.0.1:3000';
  process.env.VIRO_SCHEDULER_SERVICE_SECRET = secret;
  assert.equal((await schedulerExecutionStatus()).accepting, true);
});
