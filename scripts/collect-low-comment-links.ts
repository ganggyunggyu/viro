/**
 * 댓글 미달글 링크 수집 스크립트 (큐 등록 X, 수집/보고만)
 *
 * 등록된 모든 카페를 순회하며 댓글수 <= MAX_COMMENT_COUNT 인 글의 링크를 모아 출력한다.
 * scan-low-comment-articles.ts 와 달리 ManualCommentJob 큐에 등록하지 않는다.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/collect-low-comment-links.ts
 *   LOGIN_ID=21lab MAX_COMMENT_COUNT=3 npx tsx --env-file=.env.local scripts/collect-low-comment-links.ts
 */

import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { getAllCafes } from '../src/shared/config/cafes';
import { getCommenterAccounts } from '../src/shared/config/accounts';
import { browseCafePosts, type CafeArticle } from '../src/shared/lib/cafe-browser';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const MONGODB_URI = process.env.MONGODB_URI!;
const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const MAX_COMMENT_COUNT = Number(process.env.MAX_COMMENT_COUNT) || 3;
const PAGES_PER_CAFE = Number(process.env.PAGES_PER_CAFE) || 2;
const PER_PAGE = Number(process.env.PER_PAGE) || 20;

const buildArticleUrl = (cafeId: string, articleId: number): string =>
  `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;

interface CafeSummary {
  name: string;
  cafeSlug: string;
  cafeId: string;
  scanned: number;
  low: Array<{ articleId: number; commentCount: number; subject: string; url: string }>;
  error?: string;
}

const main = async (): Promise<void> => {
  if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  console.log(`[COLLECT] 시작 (user: ${LOGIN_ID}, 댓글 ${MAX_COMMENT_COUNT}개 이하 대상, 큐 등록 안 함)\n`);

  const onlySlugs = (process.env.CAFE_SLUGS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allCafes = await getAllCafes(user.userId);
  const cafes =
    onlySlugs.length > 0
      ? allCafes.filter((c) => onlySlugs.some((slug) => c.cafeUrl.endsWith(`/${slug}`) || c.cafeUrl === slug))
      : allCafes;
  const viewers = (await getCommenterAccounts(user.userId)).filter((a) => !a.excludeFromAutoComment);
  if (viewers.length === 0) throw new Error('글 조회용 commenter 계정 없음');

  const summaries: CafeSummary[] = [];

  for (let cafeIdx = 0; cafeIdx < cafes.length; cafeIdx += 1) {
    const cafe = cafes[cafeIdx];
    const viewer = viewers[cafeIdx % viewers.length];
    const cafeSlug = cafe.cafeUrl;

    const articlesById = new Map<number, CafeArticle>();
    let pageError: string | null = null;

    for (let page = 1; page <= PAGES_PER_CAFE; page += 1) {
      const browsed = await browseCafePosts(viewer, cafe.cafeId, undefined, {
        page,
        perPage: PER_PAGE,
        cafeUrl: cafe.cafeUrl,
      });
      if (!browsed.success) {
        pageError = browsed.error || '글 목록 조회 실패';
        break;
      }
      if (browsed.articles.length === 0) break;
      for (const article of browsed.articles) articlesById.set(article.articleId, article);
    }

    if (pageError && articlesById.size === 0) {
      summaries.push({ name: cafe.name || cafeSlug, cafeSlug, cafeId: cafe.cafeId, scanned: 0, low: [], error: pageError });
      continue;
    }

    const low = [...articlesById.values()]
      .filter((a) => a.commentCount <= MAX_COMMENT_COUNT)
      .sort((a, b) => b.articleId - a.articleId)
      .map((a) => ({
        articleId: a.articleId,
        commentCount: a.commentCount,
        subject: a.subject,
        url: buildArticleUrl(cafe.cafeId, a.articleId),
      }));

    summaries.push({ name: cafe.name || cafeSlug, cafeSlug, cafeId: cafe.cafeId, scanned: articlesById.size, low });
  }

  let totalLow = 0;
  for (const s of summaries) {
    if (s.error) {
      console.log(`\n■ ${s.name} (${s.cafeSlug}) — 에러: ${s.error}`);
      continue;
    }
    console.log(`\n■ ${s.name} (${s.cafeSlug}) — 스캔 ${s.scanned}개 / 미달글 ${s.low.length}개`);
    for (const a of s.low) {
      totalLow += 1;
      console.log(`  #${a.articleId} 댓글 ${a.commentCount}개 | ${s.cafeSlug}/${a.articleId} | ${a.subject}`);
    }
  }

  console.log(`\n[COLLECT] 총 카페 ${summaries.length}개, 댓글 ${MAX_COMMENT_COUNT}개 이하 미달글 ${totalLow}개`);
};

main()
  .catch((error) => {
    console.error('collect-low-comment-links failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeAllContexts();
    await mongoose.disconnect();
  });
