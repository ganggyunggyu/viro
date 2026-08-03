'use server';

import type { PostOnlyInput } from './types';
import { generateImages, generateTeteContent } from '@/shared/api/content-api';
import { buildCafePostContent } from '@/shared/lib/cafe-content';
import { parseKeywordWithCategory } from '@/features/auto-comment/batch/keyword-utils';
import type { ManualPublishInput } from '@/features/manual-post/types';
import { getCurrentUserId } from '@/shared/config/user';
import { getCafeById } from '@/shared/config/cafes';
import { createManualCommentJobRecord } from '@/features/manual-comment-job/actions';

export interface QueueBatchResult {
  success: boolean;
  jobsAdded: number;
  message: string;
}

export type QueueStatusResult = Record<string, { waiting: number; active: number; completed: number; failed: number }>;

export interface PreparedPostOnlyResult {
  success: boolean;
  input?: ManualPublishInput;
  error?: string;
}

export interface PublishedArticleRef {
  articleId: number;
  articleUrl?: string;
  title?: string;
}

export interface ScheduleCommentsResult {
  success: boolean;
  scheduled: number;
  failed: number;
  message: string;
}

export interface ScheduleCommentsInput {
  cafeId: string;
  articles: PublishedArticleRef[];
  delayMinMinutes: number;
  delayMaxMinutes: number;
}

// 발행 직후 그 글들에 댓글 작업을 적재한다. 실제 댓글 작성은 데스크톱 프로그램이
// 로컬 Chrome 으로 처리하므로(= '댓글만 달기'와 동일 경로), 여기서는 Mongo 작업만 만든다.
export const scheduleCommentsForPublishedAction = async (
  input: ScheduleCommentsInput,
): Promise<ScheduleCommentsResult> => {
  const targets = input.articles.filter(({ articleId }) => Number.isFinite(articleId) && articleId > 0);
  if (targets.length === 0) {
    return { success: false, scheduled: 0, failed: 0, message: '댓글을 예약할 발행 글이 없습니다' };
  }

  const [userId, cafe] = await Promise.all([
    getCurrentUserId(),
    getCafeById(input.cafeId),
  ]);
  if (!cafe) {
    return { success: false, scheduled: 0, failed: targets.length, message: '카페 정보를 찾을 수 없습니다' };
  }

  const delayMinMinutes = Math.max(0, input.delayMinMinutes);
  const delayMaxMinutes = Math.max(delayMinMinutes, input.delayMaxMinutes);

  let scheduled = 0;
  let failed = 0;
  for (const article of targets) {
    const articleUrl = article.articleUrl
      || `https://cafe.naver.com/${cafe.cafeUrl}/${article.articleId}`;
    const created = await createManualCommentJobRecord(
      userId,
      {
        articleUrl,
        cafeSlug: cafe.cafeUrl,
        cafeId: input.cafeId,
        articleId: article.articleId,
      },
      {
        articleUrl,
        mode: 'agent',
        delayMinMinutes,
        delayMaxMinutes,
        deleteExisting: false,
      },
    );
    if (created.success) scheduled += 1;
    else failed += 1;
  }

  return {
    success: scheduled > 0,
    scheduled,
    failed,
    message: failed === 0
      ? `${scheduled}개 글에 댓글 작업을 예약했습니다`
      : `${scheduled}개 예약, ${failed}개 실패`,
  };
};

// 콘텐츠와 이미지는 웹에서 준비하고, 실제 네이버 글쓰기는 데스크톱 로컬 Chrome이 수행한다.
export const preparePostOnlyAction = async (
  input: PostOnlyInput,
): Promise<PreparedPostOnlyResult> => {
  try {
    const manuscripts: ManualPublishInput['manuscripts'] = [];
    for (const keywordInput of input.keywords) {
      const { keyword, category } = parseKeywordWithCategory(keywordInput);
      const keywordLabel = category ? `${keyword}:${category}` : keyword;
      const [generated, imageResult] = await Promise.all([
        generateTeteContent({ keyword: keywordLabel, ref: input.ref }),
        input.attachImages
          ? generateImages({ keyword, count: 3 })
          : Promise.resolve({ images: [] }),
      ]);
      const { title, htmlContent } = buildCafePostContent(generated.content, keywordLabel);
      manuscripts.push({
        folderName: keywordLabel,
        title,
        body: generated.content,
        htmlContent,
        images: imageResult.images || [],
        category,
      });
    }
    return {
      success: manuscripts.length > 0,
      input: {
        manuscripts,
        cafeId: input.cafeId,
        postOptions: input.postOptions,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '콘텐츠 준비 실패',
    };
  }
};

// 글만 발행 (큐 기반) - Redis 필요
export const runPostOnlyAction = async (
  input: PostOnlyInput
): Promise<QueueBatchResult> => {
  const { keywords, ref, cafeId, postOptions, attachImages, postsPerDay } = input;

  console.log('[POST-ONLY] 큐 추가 시작:', keywords.length, '개 키워드');

  try {
    const { addBatchToQueue } = await import('../batch/batch-queue');
    return addBatchToQueue({
      service: '일반',
      keywords,
      ref,
      cafeId,
      postOptions,
      skipComments: true, // 글만 발행 (댓글/대댓글 스킵)
      attachImages,
      postsPerDay,
    });
  } catch (error) {
    console.error('[POST-ONLY] Redis 연결 실패:', error);
    return {
      success: false,
      jobsAdded: 0,
      message: 'Redis 연결 실패 - Redis 서버가 실행 중인지 확인해주세요',
    };
  }
};

// 큐 상태 조회 - Redis 필요
export const getPostQueueStatusAction = async (): Promise<QueueStatusResult> => {
  try {
    const { getBatchQueueStatus } = await import('../batch/batch-queue');
    return await getBatchQueueStatus();
  } catch (error) {
    console.error('[POST-ONLY QUEUE STATUS] Redis 연결 실패:', error);
    return {};
  }
};
