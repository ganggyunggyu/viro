import { connectDB } from '@/shared/lib/mongodb';
import { AgentToken } from '@/shared/models/agent-token';
import { ManualCommentJob, WorkerHeartbeat } from '@/shared/models';

/**
 * 댓글 작업은 브라우저가 필요해서 서버가 아니라 이용자 로컬 워커(데스크톱 Viro 앱)가 처리한다.
 * 워커가 꺼져 있으면 등록한 작업은 그냥 pending으로 쌓이기만 하는데, 화면에는 "대기"로만 보여서
 * 왜 진행이 안 되는지 알 방법이 없었다. 여기서 워커 생존 여부를 판정해 UI에 그대로 노출한다.
 *
 * 에이전트는 claim/heartbeat 등 모든 브로커 호출마다 토큰 인증을 거치고, 그때 AgentToken.lastSeenAt이
 * 갱신된다. 기본 폴링 간격이 15초라 여유를 두고 2분 이내 응답을 "연결됨"으로 본다.
 */
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

  const [tokens, localWorkers, pendingCount, runningCount] = await Promise.all([
    AgentToken.find({ userId, revoked: { $ne: true } })
      .select('label lastSeenAt')
      .sort({ lastSeenAt: -1 })
      .lean<Array<{ label: string; lastSeenAt?: Date }>>(),
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

  const workers = [...tokens.map(toWorkerView), ...localWorkers.map(toWorkerView)].sort(
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
