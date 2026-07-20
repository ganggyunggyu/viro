import { createHash, randomBytes } from 'crypto';
import { connectDB } from '@/shared/lib/mongodb';
import { AgentToken } from '@/shared/models/agent-token';
import {
  ManualCommentJob,
  type IManualCommentJob,
  type IManualCommentResult,
  type IManualCommentDeleteResult,
  type ManualCommentJobStatus,
} from '@/shared/models';
import { buildCommentAccountPool, type CommentAccount } from './account-pool';

export type { CommentAccount } from './account-pool';
export { getActiveCommenterAccounts } from './account-pool';

/**
 * 멀티테넌트 에이전트 브로커.
 *
 * Vercel(컨트롤플레인)은 잡을 Mongo에 적재만 하고, 각 이용자의 로컬 에이전트가
 * 자기 토큰으로 인증해서 자기 userId 잡만 pull → 로컬 브라우저로 실행 → 결과 리포트.
 * 에이전트는 DB/큐 자격증명을 갖지 않고 토큰만 보유한다.
 */

const STALE_CLAIM_MS = 30 * 60_000;

export const hashAgentToken = (rawToken: string): string =>
  createHash('sha256').update(rawToken).digest('hex');

export const generateAgentToken = (): string => randomBytes(32).toString('hex');

export const getBearerToken = (request: Request): string =>
  (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();

export interface AgentIdentity {
  userId: string;
  tokenId: string;
}

export const authenticateAgentToken = async (
  rawToken: string,
): Promise<AgentIdentity | null> => {
  if (!rawToken) {
    return null;
  }

  await connectDB();

  const tokenHash = hashAgentToken(rawToken);
  const doc = await AgentToken.findOneAndUpdate(
    { tokenHash, revoked: { $ne: true } },
    { $set: { lastSeenAt: new Date() } },
    { new: true },
  ).lean<{ _id: unknown; userId: string } | null>();

  if (!doc) {
    return null;
  }

  return { userId: doc.userId, tokenId: String(doc._id) };
};

export const claimJobForUser = async (
  userId: string,
  workerId: string,
): Promise<IManualCommentJob | null> => {
  await connectDB();

  const staleThreshold = new Date(Date.now() - STALE_CLAIM_MS);

  return ManualCommentJob.findOneAndUpdate(
    {
      userId,
      $or: [
        { status: 'pending' },
        { status: 'running', claimedAt: { $lt: staleThreshold } },
      ],
    },
    { $set: { status: 'running', claimedAt: new Date(), claimedBy: workerId } },
    { sort: { createdAt: 1 }, new: true },
  ).lean<IManualCommentJob>();
};

/**
 * 잡 실행에 필요한 계정 풀(자격증명 포함)을 서버측에서 구성해 반환한다.
 * 잡이 해당 userId 소유가 아니면 null. 에이전트는 이 풀만 받아 로컬 브라우저로 실행한다.
 */
export const getJobAccountPool = async (
  userId: string,
  jobId: string,
  ownerNickname: string,
  needed: number,
): Promise<CommentAccount[] | null> => {
  await connectDB();

  const job = await ManualCommentJob.findOne({ _id: jobId, userId }).lean<IManualCommentJob>();
  if (!job) {
    return null;
  }

  return buildCommentAccountPool(userId, job.cafeId, job.articleId, ownerNickname, Math.max(1, needed));
};

export const heartbeatJob = async (
  jobId: string,
  userId: string,
  workerId: string,
): Promise<boolean> => {
  await connectDB();

  const result = await ManualCommentJob.updateOne(
    { _id: jobId, userId, claimedBy: workerId, status: 'running' },
    { $set: { claimedAt: new Date() } },
  );

  return result.matchedCount > 0;
};

export interface CompleteJobInput {
  status: Extract<ManualCommentJobStatus, 'done' | 'failed'>;
  results?: IManualCommentResult[];
  deleteResults?: IManualCommentDeleteResult[];
  errorMessage?: string;
  agentSummary?: string;
}

export const completeJob = async (
  jobId: string,
  userId: string,
  input: CompleteJobInput,
): Promise<boolean> => {
  await connectDB();

  const result = await ManualCommentJob.updateOne(
    { _id: jobId, userId },
    {
      $set: {
        status: input.status,
        ...(input.results ? { results: input.results } : {}),
        ...(input.deleteResults ? { deleteResults: input.deleteResults } : {}),
        ...(input.errorMessage !== undefined ? { errorMessage: input.errorMessage } : {}),
        ...(input.agentSummary !== undefined ? { agentSummary: input.agentSummary } : {}),
      },
      $unset: { claimedBy: '', claimedAt: '' },
    },
  );

  return result.matchedCount > 0;
};
