import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { readFileSync, writeFileSync } from 'fs';
import mongoose from 'mongoose';
import { Account } from '../src/shared/models/account';
import { PublishedArticle } from '../src/shared/models/published-article';
import {
  acquireAccountLock,
  closeAllContexts,
  getPageForAccount,
  isAccountLoggedIn,
  loginAccount,
  releaseAccountLock,
  saveCookiesForAccount,
} from '../src/shared/lib/multi-session';

interface ScheduleItem {
  link: string;
  keyword: string;
  keywordType?: 'own' | 'competitor';
  category?: string;
}

interface MemberArticleItem {
  articleId?: number;
  articleid?: number;
  subject?: string;
  title?: string;
  writeDateTimestamp?: number | string;
  writeDate?: number | string;
}

interface ListedArticle {
  accountId: string;
  articleId: number;
  title: string;
  dateKey: string;
  timestamp: number;
  memberListUrl: string;
}

const MONGODB_URI = process.env.MONGODB_URI;
const SCHEDULE_FILE =
  process.env.MY_POSTS_SCHEDULE_FILE ||
  'scripts/artifacts/health-modify-schedule-2026-06-05-09.original-inaccessible-retry.json';
const CAFE_ID = process.env.MY_POSTS_CAFE_ID || '25227349';
const CAFE_URL = process.env.MY_POSTS_CAFE_URL || 'minemh';
const START_DATE = process.env.MY_POSTS_START_DATE || '2026-06-05';
const END_DATE = process.env.MY_POSTS_END_DATE || '2026-06-09';
const PAGE_LIMIT = parseInt(process.env.MY_POSTS_PAGE_LIMIT || '', 10) || 25;
const PER_PAGE = parseInt(process.env.MY_POSTS_PER_PAGE || '', 10) || 30;

if (!process.env.PLAYWRIGHT_HEADLESS) {
  process.env.PLAYWRIGHT_HEADLESS = 'true';
}

const parseCafeArticleId = (link: string): number => {
  return Number(link.match(/articles\/(\d+)/)?.[1] || 0);
};

const parseTimestamp = (value: number | string | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedNumber = Number.parseInt(value, 10);
    if (Number.isFinite(parsedNumber) && parsedNumber > 0) {
      return parsedNumber;
    }

    const parsedDate = Date.parse(value);
    if (!Number.isNaN(parsedDate)) {
      return parsedDate;
    }
  }

  return 0;
};

const toKstDateKey = (timestamp: number): string => {
  return new Date(timestamp + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
};

const isInDateRange = (dateKey: string): boolean => {
  return dateKey >= START_DATE && dateKey <= END_DATE;
};

const collectMemberArticles = async (
  accountId: string,
  password: string,
): Promise<{ memberKey: string; memberListUrl: string; articles: ListedArticle[] }> => {
  await acquireAccountLock(accountId);

  try {
    const loggedIn = await isAccountLoggedIn(accountId);
    if (!loggedIn) {
      const loginResult = await loginAccount(accountId, password, {
        waitForLoginMs: 3 * 60 * 1000,
        reason: 'inspect_health_my_posts_direct',
      });

      if (!loginResult.success) {
        throw new Error(loginResult.error || '로그인 실패');
      }
    }

    const page = await getPageForAccount(accountId);
    await page.goto(`https://cafe.naver.com/${CAFE_URL}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    await page
      .waitForFunction(
        () => {
          const globalScope = window as typeof window & { g_sUserMemberKey?: string };
          return Boolean(globalScope.g_sUserMemberKey);
        },
        { timeout: 15_000 },
      )
      .catch(() => null);
    await page.waitForTimeout(1000);

    const memberKey = await page.evaluate(() => {
      const globalScope = window as typeof window & { g_sUserMemberKey?: string };
      return globalScope.g_sUserMemberKey || '';
    });

    if (!memberKey) {
      throw new Error('카페 memberKey를 찾지 못했습니다');
    }

    const memberListUrl = `https://m.cafe.naver.com/ca-fe/web/cafes/${CAFE_ID}/members/${encodeURIComponent(memberKey)}/articles`;
    await page.goto(memberListUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    await page.waitForTimeout(1500);

    const articles: ListedArticle[] = [];
    const seenArticleIds = new Set<number>();

    for (let pageNumber = 1; pageNumber <= PAGE_LIMIT; pageNumber += 1) {
      const apiUrl =
        `https://apis.naver.com/cafe-web/cafe-mobile/CafeMemberNetworkArticleListV3` +
        `?search.cafeId=${CAFE_ID}` +
        `&search.memberKey=${encodeURIComponent(memberKey)}` +
        `&search.perPage=${PER_PAGE}` +
        `&search.page=${pageNumber}` +
        `&requestFrom=A`;

      const rawArticles = await page.evaluate(async (url: string) => {
        const response = await fetch(url, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return (
          data?.message?.result?.articleList ||
          data?.message?.result?.memberArticleList ||
          data?.message?.result?.list ||
          data?.result?.articleList ||
          data?.result?.memberArticleList ||
          data?.result?.list ||
          []
        ) as MemberArticleItem[];
      }, apiUrl);

      if (rawArticles.length === 0) {
        break;
      }

      let oldestPageDate = '';
      for (const item of rawArticles) {
        const articleId = item.articleId ?? item.articleid ?? 0;
        const timestamp = parseTimestamp(item.writeDateTimestamp ?? item.writeDate);
        if (!articleId || !timestamp || seenArticleIds.has(articleId)) {
          continue;
        }

        const dateKey = toKstDateKey(timestamp);
        if (!oldestPageDate || dateKey < oldestPageDate) {
          oldestPageDate = dateKey;
        }
        seenArticleIds.add(articleId);

        if (isInDateRange(dateKey)) {
          articles.push({
            accountId,
            articleId,
            title: item.subject || item.title || '',
            dateKey,
            timestamp,
            memberListUrl,
          });
        }
      }

      if (oldestPageDate && oldestPageDate < START_DATE) {
        break;
      }
    }

    await saveCookiesForAccount(accountId);
    return { memberKey, memberListUrl, articles };
  } finally {
    releaseAccountLock(accountId);
  }
};

const main = async (): Promise<void> => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI missing');
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  const schedule = JSON.parse(
    readFileSync(SCHEDULE_FILE, 'utf8'),
  ) as ScheduleItem[];
  const targetIds = new Set(schedule.map((item) => parseCafeArticleId(item.link)).filter(Boolean));
  const targetById = new Map(
    schedule.map((item) => [parseCafeArticleId(item.link), item]),
  );

  const publishedArticles = await PublishedArticle.find(
    { cafeId: CAFE_ID, articleId: { $in: [...targetIds] } },
    { articleId: 1, writerAccountId: 1 },
  ).lean();
  const writerByArticleId = new Map(
    publishedArticles.map((article) => [article.articleId, article.writerAccountId]),
  );
  const writerIds = [...new Set([...writerByArticleId.values()].filter(Boolean))];
  const accounts = await Account.find(
    { accountId: { $in: writerIds }, isActive: true },
    { accountId: 1, password: 1, nickname: 1 },
  ).lean();
  const accountMap = new Map(accounts.map((account) => [account.accountId, account]));

  const allListed: ListedArticle[] = [];
  const accountSummaries: Array<{
    accountId: string;
    nickname?: string;
    memberKey?: string;
    memberListUrl?: string;
    listedInRange: number;
    targetFound: number;
    error?: string;
  }> = [];

  for (const accountId of writerIds) {
    const account = accountMap.get(accountId);
    if (!account) {
      accountSummaries.push({
        accountId,
        listedInRange: 0,
        targetFound: 0,
        error: '계정 정보 없음',
      });
      continue;
    }

    console.log(`[MY POSTS] ${accountId} 내가 쓴 글 목록 확인`);
    try {
      const result = await collectMemberArticles(accountId, account.password);
      allListed.push(...result.articles);
      const targetFound = result.articles.filter((article) =>
        targetIds.has(article.articleId),
      ).length;
      accountSummaries.push({
        accountId,
        nickname: account.nickname,
        memberKey: result.memberKey,
        memberListUrl: result.memberListUrl,
        listedInRange: result.articles.length,
        targetFound,
      });
      console.log(
        `  OK listed=${result.articles.length}, targetFound=${targetFound}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      accountSummaries.push({
        accountId,
        nickname: account.nickname,
        listedInRange: 0,
        targetFound: 0,
        error: errorMessage,
      });
      console.log(`  FAIL ${errorMessage}`);
    }
  }

  const listedById = new Map(allListed.map((article) => [article.articleId, article]));
  const foundTargets = [...targetIds]
    .map((articleId) => {
      const listed = listedById.get(articleId);
      if (!listed) return null;
      const target = targetById.get(articleId);
      return {
        articleId,
        keyword: target?.keyword || '',
        title: listed.title,
        dateKey: listed.dateKey,
        accountId: listed.accountId,
        memberListUrl: listed.memberListUrl,
      };
    })
    .filter(Boolean);
  const missingTargets = [...targetIds]
    .filter((articleId) => !listedById.has(articleId))
    .map((articleId) => ({
      articleId,
      keyword: targetById.get(articleId)?.keyword || '',
      writerAccountId: writerByArticleId.get(articleId) || '',
    }));

  const output = {
    cafeId: CAFE_ID,
    cafeUrl: CAFE_URL,
    dateRange: { start: START_DATE, end: END_DATE },
    scheduleFile: SCHEDULE_FILE,
    targetCount: targetIds.size,
    listedInDateRange: allListed
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((article) => ({
        accountId: article.accountId,
        articleId: article.articleId,
        title: article.title,
        dateKey: article.dateKey,
        memberListUrl: article.memberListUrl,
      })),
    foundTargets,
    missingTargets,
    accountSummaries,
  };

  const outputPath =
    process.env.MY_POSTS_OUTPUT ||
    'scripts/artifacts/health-my-posts-direct-2026-06-05-09.json';
  const summaryPath =
    process.env.MY_POSTS_SUMMARY_OUTPUT ||
    'scripts/artifacts/health-my-posts-direct-2026-06-05-09.summary.json';

  writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
  writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        targetCount: output.targetCount,
        listedInDateRange: output.listedInDateRange.length,
        foundTargets: output.foundTargets.length,
        missingTargets: output.missingTargets.length,
        accountSummaries: output.accountSummaries,
      },
      null,
      2,
    ) + '\n',
  );

  console.log(`\n=== 내가 쓴 글 목록 확인 완료 ===`);
  console.log(`대상 ${output.targetCount}건`);
  console.log(`목록 내 6/5~6/9 글 ${output.listedInDateRange.length}건`);
  console.log(`대상 글번호 발견 ${output.foundTargets.length}건`);
  console.log(`대상 글번호 미발견 ${output.missingTargets.length}건`);
  console.log(`저장: ${outputPath}`);
  console.log(`요약: ${summaryPath}`);
};

main()
  .then(async () => {
    await closeAllContexts();
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    try {
      await closeAllContexts();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
