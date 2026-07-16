'use server';

import { connectDB } from '@/shared/lib/mongodb';
import { ManualCommentJob, type IManualCommentJob } from '@/shared/models';
import { getCurrentUserId } from '@/shared/config/user';
import { parseCafeArticleUrl } from '@/shared/lib/parse-cafe-article-url';
import { revalidatePath } from 'next/cache';
import {
  scanLowCommentArticles,
  type ScanLowCommentArticlesOptions,
  type ScanLowCommentArticlesResult,
} from './low-comment-scan';
import {
  queueCommentReplacementJobs,
  scanCommentReplacementCandidates,
  type CommentReplacementCandidate,
  type ScanCommentReplacementOptions,
} from './comment-replacement-scan';

export interface CreateManualCommentJobInput {
  articleUrl: string;
  mode: 'fixed' | 'generate' | 'agent';
  fixedComments?: string[];
  generateMinCount?: number;
  generateMaxCount?: number;
  delayMinMinutes: number;
  delayMaxMinutes: number;
  deleteExisting?: boolean;
}

export interface ManualCommentJobView {
  id: string;
  articleUrl: string;
  cafeSlug: string;
  cafeId: string;
  articleId: number;
  mode: 'fixed' | 'generate' | 'agent';
  fixedComments?: string[];
  generateMinCount?: number;
  generateMaxCount?: number;
  delayMinMs: number;
  delayMaxMs: number;
  deleteExisting: boolean;
  status: 'pending' | 'running' | 'done' | 'failed';
  errorMessage?: string;
  agentSummary?: string;
  results: Array<{
    index: number;
    accountId?: string;
    nickname?: string;
    content: string;
    success: boolean;
    error?: string;
    commentId?: string;
    postedAt?: string;
  }>;
  deleteResults: Array<{
    index: number;
    commentId: string;
    accountId?: string;
    nickname?: string;
    content: string;
    success: boolean;
    error?: string;
    deletedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const toView = (doc: IManualCommentJob): ManualCommentJobView => ({
  id: String(doc._id),
  articleUrl: doc.articleUrl,
  cafeSlug: doc.cafeSlug,
  cafeId: doc.cafeId,
  articleId: doc.articleId,
  mode: doc.mode,
  fixedComments: doc.fixedComments,
  generateMinCount: doc.generateMinCount,
  generateMaxCount: doc.generateMaxCount,
  delayMinMs: doc.delayMinMs,
  delayMaxMs: doc.delayMaxMs,
  deleteExisting: doc.deleteExisting ?? false,
  status: doc.status,
  errorMessage: doc.errorMessage,
  agentSummary: doc.agentSummary,
  results: (doc.results || []).map((r) => ({
    index: r.index,
    accountId: r.accountId,
    nickname: r.nickname,
    content: r.content,
    success: r.success,
    error: r.error,
    commentId: r.commentId,
    postedAt: r.postedAt ? new Date(r.postedAt).toISOString() : undefined,
  })),
  deleteResults: (doc.deleteResults || []).map((r) => ({
    index: r.index,
    commentId: r.commentId,
    accountId: r.accountId,
    nickname: r.nickname,
    content: r.content,
    success: r.success,
    error: r.error,
    deletedAt: r.deletedAt ? new Date(r.deletedAt).toISOString() : undefined,
  })),
  createdAt: new Date(doc.createdAt).toISOString(),
  updatedAt: new Date(doc.updatedAt).toISOString(),
});

export interface ResolvedArticleRef {
  articleUrl: string;
  cafeSlug: string;
  cafeId: string;
  articleId: number;
}

/**
 * 순수 레코드 생성 함수. revalidatePath 등 Next.js 요청 컨텍스트에 의존하지 않으므로
 * 서버 액션과 독립 스크립트(배치 스캔 등) 양쪽에서 안전하게 재사용 가능.
 */
export const createManualCommentJobRecord = async (
  userId: string,
  resolved: ResolvedArticleRef,
  input: CreateManualCommentJobInput,
): Promise<{ success: true; jobId: string } | { success: false; error: string }> => {
  await connectDB();

  if (input.mode === 'fixed') {
    const comments = (input.fixedComments || []).map((c) => c.trim()).filter(Boolean);
    if (comments.length === 0) {
      return { success: false, error: '댓글 내용을 최소 1개 이상 입력해주세요' };
    }
  } else if (input.mode === 'generate') {
    const min = input.generateMinCount ?? 0;
    const max = input.generateMaxCount ?? 0;
    if (min < 1 || max < min) {
      return { success: false, error: '생성 개수 범위가 올바르지 않습니다' };
    }
  }

  const delayMinMs = Math.max(0, Math.round(input.delayMinMinutes * 60_000));
  const delayMaxMs = Math.max(delayMinMs, Math.round(input.delayMaxMinutes * 60_000));

  const job = await ManualCommentJob.create({
    userId,
    articleUrl: resolved.articleUrl,
    cafeSlug: resolved.cafeSlug,
    cafeId: resolved.cafeId,
    articleId: resolved.articleId,
    mode: input.mode,
    fixedComments: input.mode === 'fixed' ? input.fixedComments?.map((c) => c.trim()).filter(Boolean) : undefined,
    generateMinCount: input.mode === 'generate' ? input.generateMinCount : undefined,
    generateMaxCount: input.mode === 'generate' ? input.generateMaxCount : undefined,
    delayMinMs,
    delayMaxMs,
    deleteExisting: input.deleteExisting ?? false,
    status: 'pending',
    results: [],
    deleteResults: [],
  });

  return { success: true, jobId: String(job._id) };
};

/**
 * URL 문자열에서 카페/글 정보를 파싱해 createManualCommentJobRecord로 위임.
 * userId를 인자로 받으므로 독립 스크립트에서도 그대로 호출 가능.
 */
export const createManualCommentJobForUser = async (
  userId: string,
  input: CreateManualCommentJobInput,
): Promise<{ success: true; jobId: string } | { success: false; error: string }> => {
  await connectDB();

  const parsed = await parseCafeArticleUrl(userId, input.articleUrl);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }
  if (!parsed.result.cafeId) {
    return { success: false, error: '카페 ID를 확인하지 못했습니다' };
  }

  return createManualCommentJobRecord(
    userId,
    {
      articleUrl: input.articleUrl,
      cafeSlug: parsed.result.cafeSlug,
      cafeId: parsed.result.cafeId,
      articleId: parsed.result.articleId,
    },
    input,
  );
};

export const createManualCommentJobAction = async (
  input: CreateManualCommentJobInput,
): Promise<{ success: true; jobId: string } | { success: false; error: string }> => {
  const userId = await getCurrentUserId();
  const result = await createManualCommentJobForUser(userId, input);
  if (result.success) {
    revalidatePath('/comment-jobs');
  }
  return result;
};

export const getManualCommentJobsAction = async (): Promise<ManualCommentJobView[]> => {
  await connectDB();
  const userId = await getCurrentUserId();

  const docs = await ManualCommentJob.find({ userId }).sort({ createdAt: -1 }).limit(50).lean<IManualCommentJob[]>();
  return docs.map(toView);
};

/**
 * 등록된 모든 카페를 스캔해 댓글수 <= 3인 글을 찾아 댓글 작업(5~7개, generate 모드)을 큐에 등록한다.
 * UI(ManualCommentJobUI)의 "댓글 부족 글 스캔" 버튼에서 호출.
 */
export const scanLowCommentArticlesAction = async (
  options?: ScanLowCommentArticlesOptions,
): Promise<ScanLowCommentArticlesResult> => {
  const userId = await getCurrentUserId();
  const result = await scanLowCommentArticles(userId, options);
  if (result.queuedJobs.length > 0) {
    revalidatePath('/comment-jobs');
  }
  return result;
};

export const scanCommentReplacementCandidatesAction = async (
  options: ScanCommentReplacementOptions,
) => {
  const userId = await getCurrentUserId();
  return scanCommentReplacementCandidates(userId, options);
};

export const queueCommentReplacementJobsAction = async (
  candidates: CommentReplacementCandidate[],
) => {
  const userId = await getCurrentUserId();
  const result = await queueCommentReplacementJobs(userId, candidates);
  if (result.queuedJobs.length > 0) revalidatePath('/comment-jobs');
  return result;
};
