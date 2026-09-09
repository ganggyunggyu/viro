import assert from 'node:assert/strict';
import type { TestContext } from 'node:test';
import mongoose from 'mongoose';
import { AgentToken } from '@/shared/models/agent-token';
import { ManualCommentJob, WorkerHeartbeat } from '@/shared/models';

export const NOW = 1_800_000_000_000;
export interface HeartbeatFixture {
  workerId: string;
  userId?: string;
  kind: string;
  label: string;
  lastSeenAt: Date;
}

export const isolateWorkerDatabase = (context: TestContext) => {
  const rejectAccess = () => { throw new Error('Database access is disabled in worker status tests'); };
  context.mock.method(mongoose, 'connect', rejectAccess);
  context.mock.method(mongoose.Query.prototype, 'exec', rejectAccess);
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
  context.mock.method(Date, 'now', () => NOW);
};

export const stubWorkerStatus = (context: TestContext, heartbeats: HeartbeatFixture[] = []) => {
  isolateWorkerDatabase(context);
  const query = (rows: unknown[]) => ({ select: () => ({ sort: () => ({ lean: async () => rows }) }) });
  context.mock.method(AgentToken, 'find', () => query([
    { _id: 'token-1', label: 'Paired Viro', lastSeenAt: new Date(NOW) },
  ]));
  context.mock.method(ManualCommentJob, 'countDocuments', async ({ status }: { status: string }) => status === 'pending' ? 2 : 1);
  context.mock.method(WorkerHeartbeat, 'find', (filter: {
    kind: string; userId?: string; lastSeenAt?: { $gte: Date }; $or?: unknown[];
  }) => {
    const { kind, userId, lastSeenAt, $or } = filter;
    if (kind === 'manual-comment-agent') assert.equal(userId, 'owner');
    else assert.deepEqual($or, [{ userId: 'owner' }, { userId: { $exists: false } }, { userId: null }]);
    const rows = heartbeats.filter((row) => row.kind === kind
      && (kind === 'manual-comment-agent' ? row.userId === userId : !row.userId || row.userId === 'owner')
      && (!lastSeenAt || row.lastSeenAt >= lastSeenAt.$gte));
    return query(rows);
  });
};

export const agentHeartbeat = (overrides: Partial<HeartbeatFixture> = {}): HeartbeatFixture => ({
  workerId: 'manual-comment-agent:owner:token-1:desktop', userId: 'owner',
  kind: 'manual-comment-agent', label: 'Desktop', lastSeenAt: new Date(NOW), ...overrides,
});
