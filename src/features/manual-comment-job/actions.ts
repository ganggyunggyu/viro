'use server';

import { connectDB } from '@/shared/lib/mongodb';
import { ManualCommentJob, type IManualCommentJob } from '@/shared/models';
import { getCurrentUserId } from '@/shared/config/user';
import { parseCafeArticleUrl } from '@/shared/lib/parse-cafe-article-url';
import { revalidatePath } from 'next/cache';

export interface CreateManualCommentJobInput {
  articleUrl: string;
  mode: 'fixed' | 'generate' | 'agent';
  fixedComments?: string[];
  generateMinCount?: number;
  generateMaxCount?: number;
  delayMinMinutes: number;
  delayMaxMinutes: number;
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
  createdAt: new Date(doc.createdAt).toISOString(),
  updatedAt: new Date(doc.updatedAt).toISOString(),
});

export const createManualCommentJobAction = async (
  input: CreateManualCommentJobInput,
): Promise<{ success: true; jobId: string } | { success: false; error: string }> => {
  await connectDB();
  const userId = await getCurrentUserId();

  const parsed = await parseCafeArticleUrl(userId, input.articleUrl);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

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
    articleUrl: input.articleUrl,
    cafeSlug: parsed.result.cafeSlug,
    cafeId: parsed.result.cafeId,
    articleId: parsed.result.articleId,
    mode: input.mode,
    fixedComments: input.mode === 'fixed' ? input.fixedComments?.map((c) => c.trim()).filter(Boolean) : undefined,
    generateMinCount: input.mode === 'generate' ? input.generateMinCount : undefined,
    generateMaxCount: input.mode === 'generate' ? input.generateMaxCount : undefined,
    delayMinMs,
    delayMaxMs,
    status: 'pending',
    results: [],
  });

  revalidatePath('/comment-jobs');
  return { success: true, jobId: String(job._id) };
};

export const getManualCommentJobsAction = async (): Promise<ManualCommentJobView[]> => {
  await connectDB();
  const userId = await getCurrentUserId();

  const docs = await ManualCommentJob.find({ userId }).sort({ createdAt: -1 }).limit(50).lean<IManualCommentJob[]>();
  return docs.map(toView);
};
