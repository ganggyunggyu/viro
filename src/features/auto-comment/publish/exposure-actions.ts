'use server';

import { connectDB } from '@/shared/lib/mongodb';
import { getRecentPublishedArticles, updateArticleExposure } from '@/shared/models';
import { getCafeById } from '@/shared/config/cafes';
import { checkArticleExposure } from '@/shared/lib/exposure-check';
import { logExposureResultToSheet } from '@/shared/lib/publish-log-sheet';
import type {
  PublishedArticleSummary,
  ExposureCheckInput,
  ExposureCheckRunResult,
  ExposureCheckResultItem,
} from './types';

// 노출체크 대상 후보 — 최근 발행된 원고 목록 (이미 체크한 노출 결과도 함께 반환)
export const fetchRecentPublishedArticlesAction = async (
  cafeId: string,
  limit: number = 30
): Promise<PublishedArticleSummary[]> => {
  if (!cafeId) return [];

  try {
    await connectDB();
    const articles = await getRecentPublishedArticles(cafeId, limit);

    return articles.map((article) => ({
      articleId: article.articleId,
      cafeId: article.cafeId,
      keyword: article.keyword,
      title: article.title,
      articleUrl: article.articleUrl,
      publishedAt: article.publishedAt.toISOString(),
      writerAccountId: article.writerAccountId,
      exposureStatus: article.exposureStatus,
      exposureRank: article.exposureRank,
      exposureCheckedAt: article.exposureCheckedAt?.toISOString(),
    }));
  } catch (error) {
    console.error('[EXPOSURE-ACTIONS] 발행글 조회 실패:', error);
    return [];
  }
};

const CHECK_INTERVAL_DELAY_MS = { min: 1500, max: 3000 };

const randomDelay = (minMs: number, maxMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, minMs + Math.floor(Math.random() * (maxMs - minMs + 1))));

// 카페+키워드(+글ID) 목록을 순서대로 노출체크 — DB(exposureStatus)와 구글시트 양쪽에 기록
export const runExposureCheckAction = async (
  input: ExposureCheckInput
): Promise<ExposureCheckRunResult> => {
  const { accountId, items } = input;

  if (!accountId) {
    return {
      success: false,
      total: 0,
      exposed: 0,
      notExposed: 0,
      failed: 0,
      results: [],
      message: '노출체크에 사용할 계정을 선택해줘',
    };
  }

  if (items.length === 0) {
    return {
      success: false,
      total: 0,
      exposed: 0,
      notExposed: 0,
      failed: 0,
      results: [],
      message: '체크할 카페/키워드가 없음',
    };
  }

  await connectDB();

  const cafeMetaCache = new Map<string, { name: string; cafeUrl: string }>();
  const results: ExposureCheckResultItem[] = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];

    let cafeMeta = cafeMetaCache.get(item.cafeId);
    if (!cafeMeta) {
      const cafe = await getCafeById(item.cafeId);
      cafeMeta = { name: cafe?.name ?? item.cafeId, cafeUrl: cafe?.cafeUrl ?? '' };
      cafeMetaCache.set(item.cafeId, cafeMeta);
    }

    console.log(`[EXPOSURE-CHECK] [${i + 1}/${items.length}] "${item.keyword}" @ ${cafeMeta.name}`);

    const checkResult = await checkArticleExposure({
      cafeId: item.cafeId,
      cafeUrl: cafeMeta.cafeUrl,
      cafeName: cafeMeta.name,
      keyword: item.keyword,
      accountId,
    });

    results.push({
      cafeId: item.cafeId,
      cafeName: cafeMeta.name,
      keyword: item.keyword,
      articleId: item.articleId,
      status: checkResult.status,
      rank: checkResult.rank,
      foundTitle: checkResult.foundTitle,
      foundLink: checkResult.foundLink,
      error: checkResult.error,
    });

    if (item.articleId) {
      await updateArticleExposure(item.cafeId, item.articleId, {
        status: checkResult.status,
        rank: checkResult.rank,
        foundLink: checkResult.foundLink,
      });
    }

    const sheetResult = await logExposureResultToSheet({
      cafeId: item.cafeId,
      articleId: item.articleId,
      status: checkResult.status,
      rank: checkResult.rank,
      foundLink: checkResult.foundLink,
    });
    if (!sheetResult.success) {
      console.error(`[EXPOSURE-CHECK] 시트 기록 실패: ${item.keyword} - ${sheetResult.error}`);
    }

    if (i < items.length - 1) {
      await randomDelay(CHECK_INTERVAL_DELAY_MS.min, CHECK_INTERVAL_DELAY_MS.max);
    }
  }

  const exposed = results.filter((r) => r.status === '노출').length;
  const notExposed = results.filter((r) => r.status === '미노출').length;
  const failed = results.filter((r) => r.status === '확인실패').length;

  return {
    success: true,
    total: results.length,
    exposed,
    notExposed,
    failed,
    results,
    message: `${results.length}건 확인 완료 (노출 ${exposed} / 미노출 ${notExposed} / 확인실패 ${failed})`,
  };
};
