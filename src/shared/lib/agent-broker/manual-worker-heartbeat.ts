import { connectDB } from '@/shared/lib/mongodb';
import { touchWorkerHeartbeat } from '@/shared/models/worker-heartbeat';

export const MANUAL_COMMENT_AGENT_KIND = 'manual-comment-agent';

export const getManualWorkerHeartbeatPrefix = (userId: string, tokenId: string): string =>
  `${MANUAL_COMMENT_AGENT_KIND}:${userId}:${tokenId}:`;

export const touchManualCommentWorkerHeartbeat = async ({ userId, tokenId, workerId }: {
  userId: string;
  tokenId: string;
  workerId: string;
}): Promise<void> => {
  await connectDB();
  await touchWorkerHeartbeat({
    workerId: `${getManualWorkerHeartbeatPrefix(userId, tokenId)}${workerId}`,
    userId,
    kind: MANUAL_COMMENT_AGENT_KIND,
    label: workerId,
  });
};
