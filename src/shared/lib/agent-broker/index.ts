import { createHash, randomBytes } from 'crypto';
import { connectDB } from '@/shared/lib/mongodb';
import { AgentToken } from '@/shared/models/agent-token';
import {
  ManualCommentJob,
  PublishedArticle,
  type IManualCommentJob,
  type IManualCommentResult,
  type IManualCommentDeleteResult,
  type ManualCommentJobStatus,
} from '@/shared/models';
import { generateCafeCommentBatch } from '@/shared/api/cafe-comment-batch-api';
import {
  addCommentToArticle,
  removeCommentFromArticle,
} from '@/shared/models/published-article';
import { buildCommentAccountPool, type CommentAccount } from './account-pool';

export type { CommentAccount } from './account-pool';
export { getActiveAccounts, getActiveCommenterAccounts } from './account-pool';

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
  reusableAccountIds: string[] = [],
): Promise<CommentAccount[] | null> => {
  await connectDB();

  const job = await ManualCommentJob.findOne({ _id: jobId, userId }).lean<IManualCommentJob>();
  if (!job) {
    return null;
  }

  return buildCommentAccountPool(
    userId,
    job.cafeId,
    job.articleId,
    ownerNickname,
    Math.max(1, needed),
    reusableAccountIds,
  );
};

export interface AgentArticleSnapshot {
  title: string;
  body: string;
  ownerNickname: string;
}

export interface AgentCommentPlan {
  comments: string[];
  summary?: string;
}

export const generateJobCommentPlan = async (
  userId: string,
  jobId: string,
  article: AgentArticleSnapshot,
): Promise<AgentCommentPlan | null> => {
  await connectDB();

  const job = await ManualCommentJob.findOne({ _id: jobId, userId }).lean<IManualCommentJob>();
  if (!job) {
    return null;
  }

  if (job.mode === 'fixed') {
    return {
      comments: (job.fixedComments || []).map((comment) => comment.trim()).filter(Boolean),
    };
  }

  const min = job.mode === 'agent' ? 8 : Math.max(1, job.generateMinCount || 8);
  const max = job.mode === 'agent' ? 13 : Math.max(min, job.generateMaxCount || 13);
  const exactCount = Math.floor(min + Math.random() * (max - min + 1));
  let comments: string[] = [];
  const publishedArticle = await PublishedArticle.findOne(
    { cafeId: job.cafeId, articleId: job.articleId },
    { keyword: 1 },
  ).lean<{ keyword?: string } | null>();
  const commentKeyword = publishedArticle?.keyword?.trim() || article.title.trim() || job.cafeSlug;

  for (let attempt = 0; attempt < 3 && comments.length < exactCount; attempt += 1) {
    const batch = await generateCafeCommentBatch({
      keyword: commentKeyword,
      exactCount,
      model: 'deepseek-v4-flash',
    });
    comments = batch.comments.map(({ content }) => content).slice(0, exactCount);
  }

  return {
    comments,
    summary: job.mode === 'agent'
      ? `웹 AI가 키워드로 ${comments.length}개 댓글을 계획하고 로컬 Viro가 실행함`
      : undefined,
  };
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

  const job = await ManualCommentJob.findOne({ _id: jobId, userId })
    .select('cafeId articleId')
    .lean<Pick<IManualCommentJob, 'cafeId' | 'articleId'> | null>();
  if (!job) {
    return false;
  }

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

  for (const deleted of input.deleteResults || []) {
    if (deleted.success) {
      await removeCommentFromArticle(job.cafeId, job.articleId, deleted.commentId);
    }
  }

  for (const posted of input.results || []) {
    if (!posted.success || !posted.accountId || !posted.commentId) {
      continue;
    }

    const exists = await PublishedArticle.exists({
      cafeId: job.cafeId,
      articleId: job.articleId,
      'comments.commentId': posted.commentId,
    });
    if (!exists) {
      await addCommentToArticle(job.cafeId, job.articleId, {
        accountId: posted.accountId,
        nickname: posted.nickname || posted.accountId,
        content: posted.content,
        type: 'comment',
        commentId: posted.commentId,
      });
    }
  }

  return result.matchedCount > 0;
};
