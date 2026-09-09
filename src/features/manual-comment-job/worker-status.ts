import { connectDB } from '@/shared/lib/mongodb';
import { AgentToken } from '@/shared/models/agent-token';
import { ManualCommentJob, WorkerHeartbeat } from '@/shared/models';
import {
  getManualWorkerHeartbeatPrefix,
  MANUAL_COMMENT_AGENT_KIND,
} from '@/shared/lib/agent-broker/manual-worker-heartbeat';

const ONLINE_WINDOW_MS = 2 * 60_000;

export interface CommentWorkerView {
  label: string;
  lastSeenAt: string | null;
  isOnline: boolean;
}

export interface CommentWorkerStatus {
  isOnline: boolean;
  hasPairedWorker: boolean;
  workers: CommentWorkerView[];
  pendingCount: number;
  runningCount: number;
}

export const getCommentWorkerStatus = async (userId: string): Promise<CommentWorkerStatus> => {
  await connectDB();

  const onlineThreshold = Date.now() - ONLINE_WINDOW_MS;

  const [tokens, agentWorkers, localWorkers, pendingCount, runningCount] = await Promise.all([
    AgentToken.find({ userId, revoked: { $ne: true } })
      .select('_id label')
      .sort({ createdAt: -1 })
      .lean<Array<{ _id: { toString(): string }; label: string }>>(),
    WorkerHeartbeat.find({
      userId,
      kind: MANUAL_COMMENT_AGENT_KIND,
    })
      .select('workerId lastSeenAt')
      .sort({ lastSeenAt: -1 })
      .lean<Array<{ workerId: string; lastSeenAt?: Date }>>(),
    // CLI 워커는 토큰 없이 Mongo에 직접 붙으므로 별도 하트비트로만 확인할 수 있다.
    WorkerHeartbeat.find({
      kind: 'manual-comment',
      lastSeenAt: { $gte: new Date(onlineThreshold) },
      $or: [{ userId }, { userId: { $exists: false } }, { userId: null }],
    })
      .select('label lastSeenAt')
      .sort({ lastSeenAt: -1 })
      .lean<Array<{ label: string; lastSeenAt?: Date }>>(),
    ManualCommentJob.countDocuments({ userId, status: 'pending' }),
    ManualCommentJob.countDocuments({ userId, status: 'running' }),
  ]);

  const toWorkerView = ({ label, lastSeenAt }: { label: string; lastSeenAt?: Date }): CommentWorkerView => ({
    label,
    lastSeenAt: lastSeenAt ? new Date(lastSeenAt).toISOString() : null,
    isOnline: Boolean(lastSeenAt && new Date(lastSeenAt).getTime() >= onlineThreshold),
  });

  const pairedWorkers = tokens.map(({ _id, label }) => {
    const prefix = getManualWorkerHeartbeatPrefix(userId, String(_id));
    const heartbeat = agentWorkers.find(({ workerId }) => workerId.startsWith(prefix));
    return toWorkerView({ label, lastSeenAt: heartbeat?.lastSeenAt });
  });
  const workers = [...pairedWorkers, ...localWorkers.map(toWorkerView)].sort(
    (a, b) => Number(b.isOnline) - Number(a.isOnline),
  );

  return {
    isOnline: workers.some(({ isOnline }) => isOnline),
    hasPairedWorker: workers.length > 0,
    workers,
    pendingCount,
    runningCount,
  };
};
