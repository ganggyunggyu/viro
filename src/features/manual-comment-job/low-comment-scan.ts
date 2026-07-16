import { connectDB } from '@/shared/lib/mongodb';
import { ManualCommentJob } from '@/shared/models';
import { getAllCafes } from '@/shared/config/cafes';
import { getCommenterAccounts } from '@/shared/config/accounts';
import { browseCafePosts, type CafeArticle } from '@/shared/lib/cafe-browser';
import { createManualCommentJobRecord } from './actions';

export interface LowCommentArticle {
  cafeId: string;
  cafeSlug: string;
  articleId: number;
  subject: string;
  commentCount: number;
  articleUrl: string;
}

export interface ScanLowCommentArticlesOptions {
  /** 이 값 이하 댓글수인 글을 대상으로 함 (기본 3) */
  maxCommentCount?: number;
  /** 카페당 조회할 페이지 수 (기본 2) */
  pagesPerCafe?: number;
  /** 페이지당 글 개수 (기본 20) */
  perPage?: number;
  generateMinCount?: number;
  generateMaxCount?: number;
  delayMinMinutes?: number;
  delayMaxMinutes?: number;
}

export interface ScanLowCommentArticlesResult {
  scannedCafes: number;
  foundArticles: LowCommentArticle[];
  queuedJobs: Array<{ jobId: string; cafeSlug: string; articleId: number; commentCount: number }>;
  skipped: Array<{ cafeSlug: string; articleId: number; reason: string }>;
  errors: Array<{ cafeSlug: string; error: string }>;
}

const buildArticleUrl = (cafeId: string, articleId: number): string =>
  `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;

/**
 * 등록된 모든 카페를 순회하며 댓글수가 임계값 이하인 글을 찾아
 * manual-comment-job(생성 모드) 큐에 등록한다.
 * UI 서버 액션(scanLowCommentArticlesAction)과 독립 스크립트 양쪽에서
 * userId만 넘기면 그대로 재사용 가능.
 */
export const scanLowCommentArticles = async (
  userId: string,
  options?: ScanLowCommentArticlesOptions,
): Promise<ScanLowCommentArticlesResult> => {
  await connectDB();

  const maxCommentCount = options?.maxCommentCount ?? 3;
  const pagesPerCafe = options?.pagesPerCafe ?? 2;
  const perPage = options?.perPage ?? 20;
  const generateMinCount = options?.generateMinCount ?? 5;
  const generateMaxCount = options?.generateMaxCount ?? 7;
  const delayMinMinutes = options?.delayMinMinutes ?? 0.5;
  const delayMaxMinutes = options?.delayMaxMinutes ?? 3;

  const result: ScanLowCommentArticlesResult = {
    scannedCafes: 0,
    foundArticles: [],
    queuedJobs: [],
    skipped: [],
    errors: [],
  };

  const cafes = await getAllCafes(userId);
  if (cafes.length === 0) {
    result.errors.push({ cafeSlug: '-', error: '등록된 카페가 없습니다' });
    return result;
  }

  const viewers = (await getCommenterAccounts(userId)).filter((a) => !a.excludeFromAutoComment);
  if (viewers.length === 0) {
    result.errors.push({ cafeSlug: '-', error: '글 조회에 사용할 commenter 계정이 없습니다' });
    return result;
  }

  const activeJobs = await ManualCommentJob.find(
    { userId, status: { $in: ['pending', 'running'] } },
    { cafeId: 1, articleId: 1 },
  ).lean<Array<{ cafeId: string; articleId: number }>>();
  const activeJobKeys = new Set(activeJobs.map((j) => `${j.cafeId}:${j.articleId}`));

  for (let cafeIdx = 0; cafeIdx < cafes.length; cafeIdx += 1) {
    const cafe = cafes[cafeIdx];
    const viewer = viewers[cafeIdx % viewers.length];
    const cafeSlug = cafe.cafeUrl;

    const articlesById = new Map<number, CafeArticle>();
    let pageError: string | null = null;

    for (let page = 1; page <= pagesPerCafe; page += 1) {
      const browsed = await browseCafePosts(viewer, cafe.cafeId, undefined, {
        page,
        perPage,
        cafeUrl: cafe.cafeUrl,
      });

      if (!browsed.success) {
        pageError = browsed.error || '글 목록 조회 실패';
        break;
      }
      if (browsed.articles.length === 0) break;

      for (const article of browsed.articles) {
        articlesById.set(article.articleId, article);
      }
    }

    result.scannedCafes += 1;

    if (pageError && articlesById.size === 0) {
      result.errors.push({ cafeSlug: cafe.name || cafeSlug, error: pageError });
      continue;
    }

    const lowComment = [...articlesById.values()].filter((a) => a.commentCount <= maxCommentCount);

    for (const article of lowComment) {
      const key = `${cafe.cafeId}:${article.articleId}`;
      const articleUrl = buildArticleUrl(cafe.cafeId, article.articleId);

      result.foundArticles.push({
        cafeId: cafe.cafeId,
        cafeSlug,
        articleId: article.articleId,
        subject: article.subject,
        commentCount: article.commentCount,
        articleUrl,
      });

      if (activeJobKeys.has(key)) {
        result.skipped.push({ cafeSlug, articleId: article.articleId, reason: '이미 대기/진행 중인 작업 있음' });
        continue;
      }

      const created = await createManualCommentJobRecord(
        userId,
        { articleUrl, cafeSlug, cafeId: cafe.cafeId, articleId: article.articleId },
        {
          articleUrl,
          mode: 'generate',
          generateMinCount,
          generateMaxCount,
          delayMinMinutes,
          delayMaxMinutes,
        },
      );

      if (created.success) {
        activeJobKeys.add(key);
        result.queuedJobs.push({
          jobId: created.jobId,
          cafeSlug,
          articleId: article.articleId,
          commentCount: article.commentCount,
        });
      } else {
        result.skipped.push({ cafeSlug, articleId: article.articleId, reason: created.error });
      }
    }
  }

  return result;
};
