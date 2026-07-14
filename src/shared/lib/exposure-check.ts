import { acquireAccountLock, getPageForAccount, releaseAccountLock, saveCookiesForAccount } from './multi-session';
import { buildNaverSearchUrl, extractCafeIdFromUrl, parseCafeSearchItems, type NaverCafeSearchItem } from './naver-search-parser';
import { createLogger } from './logger';

// 발행한 카페 글이 실제로 네이버 카페 검색결과에 "노출"되는지 확인.
// blog-cron-bot의 check-cafe-bot-published-exposure.ts 매칭 로직을 그대로 이식하되,
// HTML 확보는 got-scraping 직접 크롤링 대신 cafe-bot의 기존 Playwright 세션
// (multi-session.ts — 계정 락, 캡차 처리된 로그인 쿠키 재사용)을 통해 수행함.

const log = createLogger('EXPOSURE-CHECK');

export type ExposureStatus = '노출' | '미노출' | '확인실패';

export interface ExposureCheckTarget {
  cafeId: string;
  cafeUrl?: string;
  cafeName?: string;
  keyword: string;
  accountId: string;
}

export interface ExposureCheckResult {
  status: ExposureStatus;
  rank?: number;
  foundTitle?: string;
  foundLink?: string;
  error?: string;
}

const SEARCH_TIMEOUT_MS = 20000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MIN_MS = 2000;
const RETRY_DELAY_MAX_MS = 4000;

const randomDelay = (minMs: number, maxMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, minMs + Math.floor(Math.random() * (maxMs - minMs + 1))));

interface CafeMatch {
  index: number;
  item: NaverCafeSearchItem;
}

const findCafeMatch = (
  items: NaverCafeSearchItem[],
  target: { cafeUrl?: string; cafeName?: string }
): CafeMatch | null => {
  // DB에는 카페마다 cafeUrl이 슬러그("dailychat702")로도, 풀 URL("https://cafe.naver.com/dailychat702")로도
  // 섞여서 저장돼있어서 항상 슬러그로 정규화한 뒤 비교한다.
  const cafeUrl = target.cafeUrl ? extractCafeIdFromUrl(target.cafeUrl) : '';
  const cafeName = (target.cafeName ?? '').replace(/\s+/g, '').toLowerCase();

  const foundIndex = items.findIndex((item) => {
    const itemCafeId = item.cafeId.toLowerCase();
    const itemCafeName = item.cafeName.replace(/\s+/g, '').toLowerCase();
    const itemLink = item.link.toLowerCase();

    const matchesUrl =
      !!cafeUrl && (itemCafeId === cafeUrl || itemLink.includes(`cafe.naver.com/${cafeUrl}`));
    const matchesName =
      !!cafeName &&
      !!itemCafeName &&
      (itemCafeName === cafeName || itemCafeName.includes(cafeName) || cafeName.includes(itemCafeName));

    return matchesUrl || matchesName;
  });

  if (foundIndex < 0) return null;
  return { index: foundIndex, item: items[foundIndex] };
};

const fetchSearchHtml = async (accountId: string, keyword: string): Promise<string> => {
  const page = await getPageForAccount(accountId);
  const url = buildNaverSearchUrl(keyword);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: SEARCH_TIMEOUT_MS });
  await page.waitForTimeout(800 + Math.floor(Math.random() * 500));

  return page.content();
};

/** 키워드로 네이버 통합검색을 실제로 열어서 대상 카페 글이 카페 카드 영역에 노출되는지 확인 */
export const checkArticleExposure = async (target: ExposureCheckTarget): Promise<ExposureCheckResult> => {
  const { cafeId, cafeUrl, cafeName, keyword, accountId } = target;

  if (!cafeUrl && !cafeName) {
    return { status: '확인실패', error: '카페 식별 정보(cafeUrl/cafeName)가 없음' };
  }

  await acquireAccountLock(accountId);

  try {
    let lastError = '';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const html = await fetchSearchHtml(accountId, keyword);
        const items = parseCafeSearchItems(html);
        const match = findCafeMatch(items, { cafeUrl, cafeName });

        await saveCookiesForAccount(accountId);

        if (!match) {
          log.info('미노출', { cafeId, keyword, accountId });
          return { status: '미노출' };
        }

        log.info('노출 확인', { cafeId, keyword, rank: match.index + 1 });
        return {
          status: '노출',
          rank: match.index + 1,
          foundTitle: match.item.title,
          foundLink: match.item.link,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : '알 수 없는 오류';
        log.warn(`시도 ${attempt}/${MAX_ATTEMPTS} 실패`, { cafeId, keyword, error: lastError });

        if (attempt < MAX_ATTEMPTS) {
          await randomDelay(RETRY_DELAY_MIN_MS, RETRY_DELAY_MAX_MS);
        }
      }
    }

    return { status: '확인실패', error: lastError || '알 수 없는 오류' };
  } finally {
    releaseAccountLock(accountId);
  }
};
