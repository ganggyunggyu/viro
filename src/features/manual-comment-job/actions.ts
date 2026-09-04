'use server';

import { connectDB } from '@/shared/lib/mongodb';
import { ManualCommentJob, type IManualCommentJob } from '@/shared/models';
import { CAFE_COMMENT_COUNT } from '@/shared/api/cafe-comment-batch-api';
import {
  DEFAULT_CAFE_COMMENT_STYLE,
  type CafeCommentStyle,
} from '@/shared/api/cafe-comment-style';
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
import { extractCafeLinks } from './extract-cafe-links';
import { toView, type ManualCommentJobView } from './job-view';
import { getCommentWorkerStatus, type CommentWorkerStatus } from './worker-status';

export interface CreateManualCommentJobInput {
  articleUrl: string;
  mode: 'fixed' | 'generate' | 'agent';
  fixedComments?: string[];
  generateMinCount?: number;
  generateMaxCount?: number;
  commentStyle?: CafeCommentStyle;
  delayMinMinutes: number;
  delayMaxMinutes: number;
  deleteExisting?: boolean;
}

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
    commentStyle: input.commentStyle ?? DEFAULT_CAFE_COMMENT_STYLE,
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

export type BulkLinkOutcomeStatus = 'queued' | 'skipped' | 'failed';

export interface BulkLinkOutcome {
  link: string;
  status: BulkLinkOutcomeStatus;
  label: string;
  reason?: string;
}

export interface CreateCommentJobsFromLinksInput {
  rawText: string;
  mode: 'fixed' | 'generate' | 'agent';
  fixedComments?: string[];
  commentStyle?: CafeCommentStyle;
  delayMinMinutes: number;
  delayMaxMinutes: number;
  deleteExisting?: boolean;
}

export interface CreateCommentJobsFromLinksResult {
  outcomes: BulkLinkOutcome[];
  queuedCount: number;
  skippedCount: number;
  failedCount: number;
}

/** 링크 하나를 잘못 붙여넣어 수백 건이 한 번에 등록되는 사고를 막는 상한. */
const MAX_LINKS_PER_SUBMIT = 50;

/**
 * 붙여넣은 텍스트에서 카페 링크를 전부 뽑아 작업을 한 번에 등록한다.
 * 링크 하나가 실패해도 나머지는 그대로 등록하고, 링크별 결과를 돌려줘서
 * 무엇이 걸렸고 무엇이 빠졌는지 화면에서 바로 보이게 한다.
 */
export const createCommentJobsFromLinksAction = async (
  input: CreateCommentJobsFromLinksInput,
): Promise<CreateCommentJobsFromLinksResult> => {
  await connectDB();
  const userId = await getCurrentUserId();

  const links = extractCafeLinks(input.rawText).slice(0, MAX_LINKS_PER_SUBMIT);
  const outcomes: BulkLinkOutcome[] = [];

  // naver.me 단축링크 해석은 링크마다 네트워크 왕복이 필요해서 순차로 돌리면 체감이 크게 느려진다.
  const parsedLinks = await Promise.all(
    links.map(async (link) => ({ link, parsed: await parseCafeArticleUrl(userId, link) })),
  );

  for (const { link, parsed } of parsedLinks) {
    if (!parsed.success) {
      outcomes.push({ link, status: 'failed', label: link, reason: parsed.error });
      continue;
    }

    const { cafeSlug, cafeId, articleId } = parsed.result;
    const label = `${cafeSlug}/${articleId}`;

    if (!cafeId) {
      outcomes.push({ link, status: 'failed', label, reason: '카페 ID를 확인하지 못했습니다' });
      continue;
    }

    const duplicate = await ManualCommentJob.findOne({
      userId,
      cafeId,
      articleId,
      status: { $in: ['pending', 'running'] },
    })
      .select('_id')
      .lean<{ _id: unknown } | null>();
    if (duplicate) {
      outcomes.push({ link, status: 'skipped', label, reason: '이미 대기·진행 중인 작업이 있습니다' });
      continue;
    }

    const created = await createManualCommentJobRecord(
      userId,
      { articleUrl: link, cafeSlug, cafeId, articleId },
      {
        articleUrl: link,
        mode: input.mode,
        fixedComments: input.mode === 'fixed' ? input.fixedComments : undefined,
        // 생성 개수는 전 경로에서 CAFE_COMMENT_COUNT로 고정이다. 진행률 분모가 실제 게시 개수와
        // 어긋나지 않도록 min/max를 같은 값으로 채운다.
        generateMinCount: input.mode === 'generate' ? CAFE_COMMENT_COUNT : undefined,
        generateMaxCount: input.mode === 'generate' ? CAFE_COMMENT_COUNT : undefined,
        commentStyle: input.commentStyle,
        delayMinMinutes: input.delayMinMinutes,
        delayMaxMinutes: input.delayMaxMinutes,
        deleteExisting: input.deleteExisting,
      },
    );

    outcomes.push(
      created.success
        ? { link, status: 'queued', label }
        : { link, status: 'failed', label, reason: created.error },
    );
  }

  if (outcomes.some(({ status }) => status === 'queued')) {
    revalidatePath('/comment-jobs');
  }

  return {
    outcomes,
    queuedCount: outcomes.filter(({ status }) => status === 'queued').length,
    skippedCount: outcomes.filter(({ status }) => status === 'skipped').length,
    failedCount: outcomes.filter(({ status }) => status === 'failed').length,
  };
};

export const getCommentWorkerStatusAction = async (): Promise<CommentWorkerStatus> => {
  const userId = await getCurrentUserId();
  return getCommentWorkerStatus(userId);
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
  commentStyle?: CafeCommentStyle,
) => {
  const userId = await getCurrentUserId();
  const result = await queueCommentReplacementJobs(userId, candidates, commentStyle);
  if (result.queuedJobs.length > 0) revalidatePath('/comment-jobs');
  return result;
};
