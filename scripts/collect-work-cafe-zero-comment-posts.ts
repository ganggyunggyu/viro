import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { getAllAccounts } from '../src/shared/config/accounts';
import {
  acquireAccountLock,
  closeAllContexts,
  getPageForAccount,
  isAccountLoggedIn,
  loginAccount,
  releaseAccountLock,
  saveCookiesForAccount,
} from '../src/shared/lib/multi-session';
import type { NaverAccount } from '../src/shared/lib/account-manager';

interface WorkCafeInput {
  ownerName: string;
  cafeUrl: string;
  note?: string;
}

interface CollectedArticle {
  articleId: number;
  subject: string;
  nickname: string;
  memberKey?: string;
  readCount: number;
  likeCount: number;
  commentCount: number;
  writeDateTimestamp: number;
  menuId: number;
  menuName?: string;
  articleUrl: string;
}

interface CafeCollectResult {
  ownerName: string;
  cafeUrl: string;
  cafeSlug: string;
  cafeId?: string;
  status: 'ok' | 'failed';
  error?: string;
  articleCount: number;
  zeroCommentCount: number;
  articles: CollectedArticle[];
  zeroCommentArticles: CollectedArticle[];
}

interface ArticleListApiResponse {
  message?: {
    status?: string;
    error?: { code?: string; msg?: string };
    result?: {
      articleList?: Array<{
        articleId: number;
        subject: string;
        nickname: string;
        memberKey?: string;
        readCount?: number;
        likeItCount?: number;
        commentCount?: number;
        writeDateTimestamp?: number;
        menuId?: number;
        menuName?: string;
      }>;
    };
  };
  error?: string;
}

const WORK_CAFES: WorkCafeInput[] = [
  { ownerName: '가중건다', cafeUrl: 'https://cafe.naver.com/healthhhh' },
  { ownerName: '운연정', cafeUrl: 'https://cafe.naver.com/driveee' },
  { ownerName: '빨간모자앤 1', cafeUrl: 'https://cafe.naver.com/mealtalkdht' },
  { ownerName: '소원 1', cafeUrl: 'https://cafe.naver.com/localtable702' },
  { ownerName: '똑똑한건희씨', cafeUrl: 'https://cafe.naver.com/menunote702' },
  { ownerName: '고래낚시 1', cafeUrl: 'https://cafe.naver.com/tableclub702' },
  { ownerName: '티니피쉬 1', cafeUrl: 'https://cafe.naver.com/petinfo183' },
  { ownerName: '강아지강하지 1', cafeUrl: 'https://cafe.naver.com/dogwalk2m4' },
  { ownerName: '고구마스틱2 (10개) 1', cafeUrl: 'https://cafe.naver.com/carelog702' },
  { ownerName: '룰루랄라 2 (12개) 1', cafeUrl: 'https://cafe.naver.com/habitnote702' },
  { ownerName: '실눈캐', cafeUrl: 'https://cafe.naver.com/infomadang702' },
  { ownerName: '햄부기', cafeUrl: 'https://cafe.naver.com/talkmadang702' },
  { ownerName: '강아지강하지 1', cafeUrl: 'https://cafe.naver.com/walknote702' },
  { ownerName: '티니피쉬 1', cafeUrl: 'https://cafe.naver.com/petnote702' },
  { ownerName: '빨간모자앤  1', cafeUrl: 'https://cafe.naver.com/babsangnote702' },
];

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const VIEWER_ACCOUNT_ID = process.env.VERIFY_ACCOUNT_ID || process.env.CHECKER_ACCOUNT_ID || 'produce11745';
const DEFAULT_PER_PAGE = 20;
const DEFAULT_MAX_PAGES = 30;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const args = process.argv.slice(2);

const getArgValue = (name: string, fallback: string): string => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];

  return fallback;
};

const getCafeSlug = (cafeUrl: string): string => {
  const withoutQuery = cafeUrl.split('?')[0].replace(/\/$/, '');
  return withoutQuery.split('/').filter(Boolean).at(-1) || cafeUrl;
};

const toKstDateTime = (timestamp: number): string => {
  if (!timestamp) return '';
  return new Date(timestamp + KST_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ');
};

const csvEscape = (value: unknown): string => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const ensureLoggedIn = async (account: NaverAccount): Promise<void> => {
  const loggedIn = await isAccountLoggedIn(account.id);
  if (loggedIn) return;

  const result = await loginAccount(account.id, account.password, {
    waitForLoginMs: 3 * 60 * 1000,
    reason: 'collect_work_cafe_zero_comments',
  });

  if (!result.success) {
    throw new Error(result.error || 'login failed');
  }
};

const resolveCafeIdFromPage = async (
  page: Awaited<ReturnType<typeof getPageForAccount>>,
  cafeUrl: string,
): Promise<string> => {
  await page.goto(cafeUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.waitForTimeout(1800);

  const urlMatch = page.url().match(/\/cafes\/(\d+)/);
  if (urlMatch?.[1]) return urlMatch[1];

  const resolved = await page.evaluate(() => {
    const win = window as Window & {
      g_sClubId?: string;
      clubId?: string | number;
      cafeInfo?: { clubId?: string | number };
      __APOLLO_STATE__?: unknown;
    };

    const candidates = [
      win.g_sClubId,
      win.clubId,
      win.cafeInfo?.clubId,
    ]
      .map((value) => String(value || '').trim())
      .filter((value) => /^\d+$/.test(value));
    if (candidates[0]) return candidates[0];

    const html = document.documentElement.innerHTML;
    const patterns = [
      /g_sClubId\s*=\s*['"]?(\d+)/i,
      /clubid\s*[:=]\s*['"]?(\d+)/i,
      /clubId['"]?\s*:\s*['"]?(\d+)/i,
      /"clubId"\s*:\s*"?(\d+)/i,
      /search\.clubid=(\d+)/i,
      /\/cafes\/(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return match[1];
    }

    return '';
  });

  if (resolved) return resolved;
  throw new Error(`cafeId resolve failed: ${cafeUrl} final=${page.url()}`);
};

const fetchArticlePage = async (
  page: Awaited<ReturnType<typeof getPageForAccount>>,
  cafeId: string,
  pageNo: number,
  perPage: number,
): Promise<CollectedArticle[]> => {
  const apiUrl = [
    'https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json',
    `?search.clubid=${encodeURIComponent(cafeId)}`,
    `&search.page=${pageNo}`,
    `&search.perPage=${perPage}`,
    '&search.queryType=lastArticle',
    '&search.boardtype=L',
  ].join('');

  const apiResult = await page.evaluate(async (url: string) => {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return { error: `HTTP ${response.status}` };
      return await response.json();
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, apiUrl) as ArticleListApiResponse;

  if (apiResult.error) throw new Error(apiResult.error);
  if (apiResult.message?.status !== '200') {
    throw new Error(apiResult.message?.error?.msg || `API status ${apiResult.message?.status || 'unknown'}`);
  }

  return (apiResult.message.result?.articleList || []).map((item) => ({
    articleId: item.articleId,
    subject: item.subject,
    nickname: item.nickname,
    memberKey: item.memberKey,
    readCount: item.readCount || 0,
    likeCount: item.likeItCount || 0,
    commentCount: item.commentCount || 0,
    writeDateTimestamp: item.writeDateTimestamp || 0,
    menuId: item.menuId || 0,
    menuName: item.menuName,
    articleUrl: `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${item.articleId}`,
  }));
};

const collectCafe = async (
  page: Awaited<ReturnType<typeof getPageForAccount>>,
  cafe: WorkCafeInput,
  options: { perPage: number; maxPages: number },
): Promise<CafeCollectResult> => {
  const cafeSlug = getCafeSlug(cafe.cafeUrl);

  try {
    const cafeId = await resolveCafeIdFromPage(page, cafe.cafeUrl);
    const articles: CollectedArticle[] = [];
    const effectivePerPage = Math.min(options.perPage, 20);

    for (let pageNo = 1; pageNo <= options.maxPages; pageNo += 1) {
      const pageArticles = await fetchArticlePage(page, cafeId, pageNo, effectivePerPage);
      if (pageArticles.length === 0) break;
      articles.push(...pageArticles);
      if (pageArticles.length < effectivePerPage) break;
      await page.waitForTimeout(250);
    }

    const deduped = Array.from(
      new Map(articles.map((article) => [article.articleId, article])).values(),
    ).sort((a, b) => b.articleId - a.articleId);
    const zeroCommentArticles = deduped.filter((article) => article.commentCount === 0);

    return {
      ownerName: cafe.ownerName,
      cafeUrl: cafe.cafeUrl,
      cafeSlug,
      cafeId,
      status: 'ok',
      articleCount: deduped.length,
      zeroCommentCount: zeroCommentArticles.length,
      articles: deduped,
      zeroCommentArticles,
    };
  } catch (error) {
    return {
      ownerName: cafe.ownerName,
      cafeUrl: cafe.cafeUrl,
      cafeSlug,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      articleCount: 0,
      zeroCommentCount: 0,
      articles: [],
      zeroCommentArticles: [],
    };
  }
};

const writeArtifacts = (payload: {
  generatedAt: string;
  viewerAccountId: string;
  perPage: number;
  maxPages: number;
  cafes: CafeCollectResult[];
}): { jsonPath: string; csvPath: string; mdPath: string } => {
  const outputDir = join(process.cwd(), 'outputs');
  mkdirSync(outputDir, { recursive: true });
  const timestamp = payload.generatedAt.replace(/[:.]/g, '-');
  const jsonPath = join(outputDir, `work-cafe-zero-comment-posts-${timestamp}.json`);
  const csvPath = join(outputDir, `work-cafe-zero-comment-posts-${timestamp}.csv`);
  const mdPath = join(outputDir, `work-cafe-zero-comment-posts-${timestamp}.md`);

  const zeroRows = payload.cafes.flatMap((cafe) =>
    cafe.zeroCommentArticles.map((article) => ({
      ownerName: cafe.ownerName,
      cafeSlug: cafe.cafeSlug,
      cafeId: cafe.cafeId || '',
      cafeUrl: cafe.cafeUrl,
      articleId: article.articleId,
      subject: article.subject,
      nickname: article.nickname,
      menuName: article.menuName || '',
      readCount: article.readCount,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      writeDateKst: toKstDateTime(article.writeDateTimestamp),
      articleUrl: article.articleUrl,
    })),
  );

  const csvHeader = [
    'ownerName',
    'cafeSlug',
    'cafeId',
    'cafeUrl',
    'articleId',
    'subject',
    'nickname',
    'menuName',
    'readCount',
    'likeCount',
    'commentCount',
    'writeDateKst',
    'articleUrl',
  ];

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');
  writeFileSync(
    csvPath,
    [
      csvHeader.join(','),
      ...zeroRows.map((row) => csvHeader.map((key) => csvEscape(row[key as keyof typeof row])).join(',')),
    ].join('\n'),
    'utf-8',
  );
  writeFileSync(
    mdPath,
    [
      '# 작업카페 댓글 0건 글 수집',
      '',
      `- generatedAt: ${payload.generatedAt}`,
      `- viewerAccountId: ${payload.viewerAccountId}`,
      `- totalCafes: ${payload.cafes.length}`,
      `- totalArticles: ${payload.cafes.reduce((sum, cafe) => sum + cafe.articleCount, 0)}`,
      `- zeroCommentArticles: ${zeroRows.length}`,
      '',
      '## 작업카페',
      '',
      '|계정명|카페URL|카페ID|전체글|댓글0|상태|',
      '|---|---|---:|---:|---:|---|',
      ...payload.cafes.map((cafe) =>
        `|${[
          cafe.ownerName,
          cafe.cafeUrl,
          cafe.cafeId || '',
          cafe.articleCount,
          cafe.zeroCommentCount,
          cafe.status === 'ok' ? 'ok' : `failed: ${cafe.error || ''}`,
        ].join('|')}|`,
      ),
      '',
      '## 댓글 0건 글',
      '',
      '|카페|글ID|제목|작성자|메뉴|조회|작성일|링크|',
      '|---|---:|---|---|---|---:|---|---|',
      ...zeroRows.map((row) =>
        `|${[
          row.cafeSlug,
          row.articleId,
          row.subject,
          row.nickname,
          row.menuName,
          row.readCount,
          row.writeDateKst,
          row.articleUrl,
        ].join('|')}|`,
      ),
      '',
    ].join('\n'),
    'utf-8',
  );

  return { jsonPath, csvPath, mdPath };
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  const perPage = Number(getArgValue('--per-page', String(DEFAULT_PER_PAGE)));
  const maxPages = Number(getArgValue('--max-pages', String(DEFAULT_MAX_PAGES)));
  const loginId = getArgValue('--login-id', LOGIN_ID);
  const requestedViewerId = getArgValue('--account-id', VIEWER_ACCOUNT_ID);

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  const user = await User.findOne({ loginId, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${loginId}`);

  const accounts = await getAllAccounts(user.userId);
  const viewerAccount = accounts.find((account) => account.id === requestedViewerId) || accounts[0];
  if (!viewerAccount) throw new Error('viewer account not found');

  await acquireAccountLock(viewerAccount.id);

  const cafes: CafeCollectResult[] = [];
  try {
    await ensureLoggedIn(viewerAccount);
    const page = await getPageForAccount(viewerAccount.id);

    for (const cafe of WORK_CAFES) {
      console.log(`[CAFE] ${cafe.ownerName} ${cafe.cafeUrl}`);
      const result = await collectCafe(page, cafe, { perPage, maxPages });
      cafes.push(result);
      console.log(
        `  -> ${result.status} cafeId=${result.cafeId || '-'} articles=${result.articleCount} zero=${result.zeroCommentCount}${result.error ? ` error=${result.error}` : ''}`,
      );
    }

    await saveCookiesForAccount(viewerAccount.id);
  } finally {
    releaseAccountLock(viewerAccount.id);
  }

  const generatedAt = new Date().toISOString();
  const payload = {
    generatedAt,
    viewerAccountId: viewerAccount.id,
    perPage,
    maxPages,
    cafes,
  };

  const paths = writeArtifacts(payload);
  const totalArticles = cafes.reduce((sum, cafe) => sum + cafe.articleCount, 0);
  const totalZero = cafes.reduce((sum, cafe) => sum + cafe.zeroCommentCount, 0);

  console.log('collect work cafe zero comment posts complete');
  console.log(`cafes: ${cafes.length}`);
  console.log(`articles: ${totalArticles}`);
  console.log(`zeroCommentArticles: ${totalZero}`);
  console.log(`json: ${paths.jsonPath}`);
  console.log(`csv: ${paths.csvPath}`);
  console.log(`md: ${paths.mdPath}`);
};

main()
  .catch((error) => {
    console.error('collect-work-cafe-zero-comment-posts failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closeAllContexts();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(process.exitCode || 0);
  });
