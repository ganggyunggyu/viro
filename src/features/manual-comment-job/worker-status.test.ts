import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCommentWorkerStatus } from '@/features/manual-comment-job/worker-status';
import { agentHeartbeat, NOW, stubWorkerStatus } from '@/features/manual-comment-job/worker-status.test-support';

test('recent authenticated API token usage alone does not make a comment worker online', async (context) => {
  stubWorkerStatus(context);
  const status = await getCommentWorkerStatus('owner');
  assert.equal(status.isOnline, false);
  assert.equal(status.hasPairedWorker, true);
  assert.deepEqual(status.workers, [{ label: 'Paired Viro', lastSeenAt: null, isOnline: false }]);
  assert.equal(status.pendingCount, 2);
  assert.equal(status.runningCount, 1);
});

test('an explicit heartbeat for this owner and paired token makes the worker online', async (context) => {
  stubWorkerStatus(context, [agentHeartbeat()]);
  const { isOnline, workers } = await getCommentWorkerStatus('owner');
  assert.equal(isOnline, true);
  assert.equal(workers[0].lastSeenAt, new Date(NOW).toISOString());
});

for (const [name, heartbeat] of [
  ['expired', agentHeartbeat({ lastSeenAt: new Date(NOW - 120_001) })],
  ['another owner', agentHeartbeat({ userId: 'other' })],
  ['another token', agentHeartbeat({ workerId: 'manual-comment-agent:owner:token-2:desktop' })],
  ['another worker capability', agentHeartbeat({ kind: 'agent-operations' })],
] as const) {
  test(`a heartbeat from ${name} cannot mark this comment worker online`, async (context) => {
    stubWorkerStatus(context, [heartbeat]);
    assert.equal((await getCommentWorkerStatus('owner')).isOnline, false);
  });
}

test('the existing direct CLI heartbeat remains online for its owner or global worker', async (context) => {
  stubWorkerStatus(context, [
    agentHeartbeat({ kind: 'manual-comment', workerId: 'owner-cli', label: 'Owner CLI' }),
    agentHeartbeat({ kind: 'manual-comment', workerId: 'global-cli', userId: undefined, label: 'Global CLI' }),
    agentHeartbeat({ kind: 'manual-comment', workerId: 'other-cli', userId: 'other', label: 'Other CLI' }),
    agentHeartbeat({ kind: 'manual-comment', workerId: 'expired-cli', lastSeenAt: new Date(NOW - 120_001), label: 'Expired CLI' }),
  ]);
  const { workers } = await getCommentWorkerStatus('owner');
  assert.deepEqual(workers.filter(({ isOnline }) => isOnline).map(({ label }) => label), ['Owner CLI', 'Global CLI']);
});

test('an explicit heartbeat expires after 120 seconds, with the boundary still online', async (context) => {
  stubWorkerStatus(context, [agentHeartbeat({ lastSeenAt: new Date(NOW - 120_000) })]);
  assert.equal((await getCommentWorkerStatus('owner')).isOnline, true);
});

test('an offline worker retains its last actual heartbeat time for the last response display', async (context) => {
  const lastSeenAt = new Date(NOW - 120_001);
  stubWorkerStatus(context, [agentHeartbeat({ lastSeenAt })]);
  const { isOnline, workers } = await getCommentWorkerStatus('owner');
  assert.equal(isOnline, false);
  assert.equal(workers[0].lastSeenAt, lastSeenAt.toISOString());
});
