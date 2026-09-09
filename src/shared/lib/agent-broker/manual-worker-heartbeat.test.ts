import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { POST as claim } from '@/app/api/agent/claim/route';
import { POST as heartbeat } from '@/app/api/agent/heartbeat/route';
import { GET as getWorker } from '@/app/api/agent/worker/route';
import { isolateWorkerDatabase, stubWorkerStatus } from '@/features/manual-comment-job/worker-status.test-support';
import { AgentToken } from '@/shared/models/agent-token';
import { User } from '@/shared/models/user';
import { ManualCommentJob, WorkerHeartbeat } from '@/shared/models';

const authenticateOwner = (context: TestContext) => {
  isolateWorkerDatabase(context);
  context.mock.method(AgentToken, 'findOne', () => ({ lean: async () => ({ _id: 'token-1', userId: 'owner' }) }));
  context.mock.method(AgentToken, 'updateOne', async () => ({ matchedCount: 1 }));
  context.mock.method(User, 'exists', async () => ({ _id: 'owner' }));
  return context.mock.method(WorkerHeartbeat, 'updateOne', async () => ({ matchedCount: 1 }));
};

const request = (body: object) => new Request('https://viro.example/api/agent/worker', {
  method: 'POST', headers: { authorization: 'Bearer synthetic-test-token' }, body: JSON.stringify(body),
});

test('a real claim poll records an owner-scoped manual-comment agent heartbeat even with no work', async (context) => {
  const touch = authenticateOwner(context);
  context.mock.method(ManualCommentJob, 'findOneAndUpdate', () => ({ lean: async () => null }));
  const response = await claim(request({ workerId: 'desktop', userId: 'injected-owner' }));
  assert.deepEqual(await response.json(), { job: null });
  assert.equal(touch.mock.callCount(), 1);
  const [filter, update] = touch.mock.calls[0].arguments;
  assert.deepEqual(filter, { workerId: 'manual-comment-agent:owner:token-1:desktop' });
  assert.ok(update && '$set' in update);
  assert.equal(update.$set?.userId, 'owner');
  assert.equal(update.$set?.kind, 'manual-comment-agent');
  assert.ok(update.$set?.lastSeenAt instanceof Date);
});

test('only a heartbeat for a matching running job updates worker liveness', async (context) => {
  const touch = authenticateOwner(context);
  let matchedCount = 0;
  const renew = context.mock.method(ManualCommentJob, 'updateOne', async () => ({ matchedCount }));
  const inactive = await heartbeat(request({ jobId: 'job', workerId: 'desktop' }));
  assert.deepEqual(await inactive.json(), { ok: false });
  assert.equal(touch.mock.callCount(), 0);
  matchedCount = 1;
  const active = await heartbeat(request({ jobId: 'job', workerId: 'desktop' }));
  assert.deepEqual(await active.json(), { ok: true });
  assert.equal(touch.mock.callCount(), 1);
  assert.deepEqual(renew.mock.calls[1].arguments[0], {
    _id: 'job', userId: 'owner', claimedBy: 'desktop', status: 'running',
  });
});

test('missing jobs and unauthenticated requests do not refresh worker liveness', async (context) => {
  const touch = authenticateOwner(context);
  assert.equal((await heartbeat(request({ workerId: 'desktop' }))).status, 400);
  for (const route of [claim, heartbeat]) {
    const unauthenticated = new Request('https://viro.example/api/agent/worker', { method: 'POST', body: '{}' });
    assert.equal((await route(unauthenticated)).status, 401);
  }
  assert.equal(touch.mock.callCount(), 0);
});

test('the authenticated worker status GET cannot make itself online or write a worker heartbeat', async (context) => {
  stubWorkerStatus(context);
  context.mock.method(AgentToken, 'findOne', () => ({ lean: async () => ({ _id: 'token-1', userId: 'owner' }) }));
  context.mock.method(AgentToken, 'updateOne', async () => ({ matchedCount: 1 }));
  context.mock.method(User, 'exists', async () => ({ _id: 'owner' }));
  const touch = context.mock.method(WorkerHeartbeat, 'updateOne', async () => ({ matchedCount: 1 }));
  const response = await getWorker(new Request('https://viro.example/api/agent/worker', {
    headers: { authorization: 'Bearer synthetic-test-token' },
  }), undefined);
  assert.equal(response.status, 200);
  const status = await response.json();
  assert.equal(status.isOnline, false);
  assert.equal(touch.mock.callCount(), 0);
});
