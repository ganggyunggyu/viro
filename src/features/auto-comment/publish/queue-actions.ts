'use server';

import type { PostOnlyInput } from './types';
import { generateImages, generateTeteContent } from '@/shared/api/content-api';
import { buildCafePostContent } from '@/shared/lib/cafe-content';
import { parseKeywordWithCategory } from '@/features/auto-comment/batch/keyword-utils';
import type { ManualPublishInput } from '@/features/manual-post/types';

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
