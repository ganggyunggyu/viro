import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const TARGET_CAFE_SLUG = 'mealtalkdht';
const TARGET_CAFE_ID = '31750099';
const TARGET_CAFE_NAME = '맛집 밥상노트';
const LIVE_CONFIRM_FLAG = '--confirm-live-post';
const QUEUE_WAIT_TIMEOUT_MS = 10 * 60 * 1000;
const QUEUE_POLL_INTERVAL_MS = 2 * 1000;
const OPERATIONS_SHEET_ID = '1JMNXyIaTR55aX4SRcD4Kp09W-WNjqMwMi0Xt2TV7ZYw';
const PUBLISH_LOG_RANGE = '카페발행노출로그!A:K';

export type E2eStepId =
  | 'account-management'
  | 'account-registration-dry'
  | 'cafe-management'
  | 'cafe-registration-dry'
  | 'queue-management'
  | 'post-writing'
  | 'comment-writing'
  | 'post-comment-verification';

type E2ePhase = 'read-only' | 'mutation';
type E2eStatus = 'PASS' | 'SKIP' | 'FAIL';

export interface E2eStep {
  id: E2eStepId;
  label: string;
  phase: E2ePhase;
  write: boolean;
  execute: boolean;
  skipReason?: string;
}

export interface E2eStepResult {
  id: E2eStepId;
  label: string;
  status: E2eStatus;
  detail: string;
}

export interface E2eStepHandlerResult {
  status: E2eStatus;
  detail: string;
}

export type E2eStepHandler = () => Promise<E2eStepHandlerResult>;

interface AccountLike {
  id: string;
  password: string;
  nickname?: string;
  role?: 'writer' | 'commenter';
  isMain?: boolean;
  activityHours?: { start: number; end: number };
  restDays?: number[];
  dailyPostLimit?: number;
  personaId?: string;
  campaignTag?: string;
  excludeFromAutoComment?: boolean;
  targetCafeIds?: string[];
}

interface CafeLike {
  cafeId: string;
  cafeUrl: string;
  menuId: string;
  name: string;
  categories: string[];
  isDefault?: boolean;
  categoryMenuIds?: Record<string, string>;
  categoryAliases?: Record<string, string>;
  ownerAccountId?: string;
}

interface CafeAccountRoster {
  cafeSlug: string;
  writerAccounts: AccountLike[];
  commenterAccounts: AccountLike[];
}

interface CafeContext extends CafeAccountRoster {
  userId: string;
  accounts: AccountLike[];
  cafe: CafeLike;
}

interface StoredSessionSelection {
  status: 'PASS' | 'SKIP';
  detail: string;
  account?: AccountLike;
}

interface QueueJobLike {
  id?: string | number;
  data: {
    type: string;
    cafeId?: string;
    keyword?: string;
  };
  returnvalue?: {
    success?: boolean;
    articleId?: number;
    articleUrl?: string;
    error?: string;
  };
  failedReason?: string;
  getState: () => Promise<string>;
}

interface QueueLike {
  getJobs: (
    types: Array<'waiting' | 'delayed' | 'active' | 'completed' | 'failed'>,
    start: number,
    end: number,
    asc: boolean,
  ) => Promise<QueueJobLike[]>;
}

interface PublishedPostState {
  articleId: number;
  articleUrl: string;
  keyword: string;
  writerAccount: AccountLike;
}

interface PublishedCommentState {
  content: string;
  commenterAccount: AccountLike;
}

interface RuntimeState {
  context?: CafeContext;
  viewerAccount?: AccountLike;
  publishedPost?: PublishedPostState;
  publishedComment?: PublishedCommentState;
}

interface CafeAccountRosterInput {
  accounts: AccountLike[];
  cafe: CafeLike;
  toCafeSlug: (cafeUrl: string) => string;
  getCafeWriterAccounts: (
    accounts: AccountLike[],
    cafeId?: string,
    cafeSlug?: string,
  ) => AccountLike[];
  getCafeCommenterAccounts: (
    accounts: AccountLike[],
    cafeId?: string,
    cafeSlug?: string,
  ) => AccountLike[];
}

const STEP_BLUEPRINTS: ReadonlyArray<Omit<E2eStep, 'execute' | 'skipReason'>> = [
  { id: 'account-management', label: '계정관리', phase: 'read-only', write: false },
  { id: 'account-registration-dry', label: '계정정보 DB 등록 dry', phase: 'read-only', write: false },
  { id: 'cafe-management', label: '카페관리', phase: 'read-only', write: false },
  { id: 'cafe-registration-dry', label: '카페 DB 등록 dry', phase: 'read-only', write: false },
  { id: 'queue-management', label: '큐관리', phase: 'read-only', write: false },
  { id: 'post-writing', label: '글작성', phase: 'mutation', write: true },
  { id: 'comment-writing', label: '댓글작성', phase: 'mutation', write: true },
  { id: 'post-comment-verification', label: '글+댓글 검증', phase: 'mutation', write: false },
];

export const isMutationConfirmed = (argv: string[]): boolean =>
  argv.includes(LIVE_CONFIRM_FLAG);

export const buildE2ePlan = (argv: string[]): E2eStep[] => {
  const mutationConfirmed = isMutationConfirmed(argv);

  return STEP_BLUEPRINTS.map((step) => ({
    ...step,
    execute: step.phase === 'read-only' || mutationConfirmed,
    ...(step.phase === 'mutation' && !mutationConfirmed
      ? { skipReason: 'gated (skipped)' }
      : {}),
  }));
};

export const runE2ePlan = async (
  plan: E2eStep[],
  handlers: Partial<Record<E2eStepId, E2eStepHandler>>,
): Promise<E2eStepResult[]> => {
  const results: E2eStepResult[] = [];

  for (const step of plan) {
    if (!step.execute) {
      results.push({
        id: step.id,
        label: step.label,
        status: 'SKIP',
        detail: step.skipReason ?? 'skipped',
      });
      continue;
    }

    const handler = handlers[step.id];
    if (!handler) {
      results.push({
        id: step.id,
        label: step.label,
        status: 'FAIL',
        detail: 'handler missing',
      });
      continue;
    }

    try {
      const { status, detail } = await handler();
      results.push({ id: step.id, label: step.label, status, detail });
    } catch (error) {
      results.push({
        id: step.id,
        label: step.label,
        status: 'FAIL',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
};

export const selectStoredSessionAccount = async ({
  accounts,
  isAccountLoggedIn,
}: {
  accounts: AccountLike[];
  isAccountLoggedIn: (accountId: string) => Promise<boolean>;
}): Promise<StoredSessionSelection> => {
  const uniqueAccounts = accounts.filter(({ id }, index) =>
    accounts.findIndex((account) => account.id === id) === index);

  for (const account of uniqueAccounts) {
    const isLoggedIn = await isAccountLoggedIn(account.id).catch(() => false);
    if (isLoggedIn) {
      return {
        status: 'PASS',
        detail: `stored session valid: ${account.id}`,
        account,
      };
    }
  }

  return {
    status: 'SKIP',
    detail: 'session invalid, skipped(재로그인 안 함)',
  };
};

export const selectCafeAccountRoster = ({
  accounts,
  cafe,
  toCafeSlug,
  getCafeWriterAccounts,
  getCafeCommenterAccounts,
}: CafeAccountRosterInput): CafeAccountRoster => {
  const cafeSlug = toCafeSlug(cafe.cafeUrl);
  const writerAccounts = getCafeWriterAccounts(accounts, cafe.cafeId, cafeSlug);
  const commenterAccounts = getCafeCommenterAccounts(accounts, cafe.cafeId, cafeSlug);

  return { cafeSlug, writerAccounts, commenterAccounts };
};

const getRuntimeContext = (state: RuntimeState): CafeContext => {
  if (!state.context) {
    throw new Error('카페/계정 컨텍스트가 준비되지 않았습니다');
  }

  return state.context;
};

const loadCafeContext = async (): Promise<CafeContext> => {
  const [
    { connectDB },
    { getAllAccounts },
    { getAllCafes },
    { getCafeWriterAccounts, getCafeCommenterAccounts },
    { toCafeSlug },
    { Cafe },
  ] = await Promise.all([
    import('@/shared/lib/mongodb'),
    import('@/shared/config/accounts'),
    import('@/shared/config/cafes'),
    import('@/shared/config/cafe-account-policy'),
    import('@/shared/lib/naver-cafe-membership'),
    import('@/shared/models'),
  ]);

  await connectDB();
  const cafeDocument = await Cafe.findOne({
    cafeUrl: { $regex: TARGET_CAFE_SLUG, $options: 'i' },
    isActive: true,
  }).lean() as unknown as { userId?: string; cafeId?: string } | null;

  if (!cafeDocument?.userId || !cafeDocument?.cafeId) {
    throw new Error(`Cafe config not found for slug: ${TARGET_CAFE_SLUG}`);
  }

  const resolvedCafeId = String(cafeDocument.cafeId);
  const userId = String(cafeDocument.userId);
  const [accounts, cafes] = await Promise.all([
    getAllAccounts(userId),
    getAllCafes(userId),
  ]);
  const cafe = cafes.find(({ cafeId }) => cafeId === resolvedCafeId);

  if (!cafe) {
    throw new Error(`active Cafe config not found for slug: ${TARGET_CAFE_SLUG} (cafeId=${resolvedCafeId})`);
  }

  const roster = selectCafeAccountRoster({
    accounts,
    cafe,
    toCafeSlug,
    getCafeWriterAccounts,
    getCafeCommenterAccounts,
  });

  if (roster.cafeSlug !== TARGET_CAFE_SLUG) {
    throw new Error(`Cafe slug mismatch: ${roster.cafeSlug || '(empty)'}`);
  }

  return { userId, accounts, cafe, ...roster };
};

const verifyAccountRegistrationDry = async (): Promise<void> => {
  const { createAccountRegistration } = await import('@/shared/lib/account-registration-harness');
  let upsertCalled = false;
  const register = createAccountRegistration({
    findActive: async () => null,
    upsert: async () => {
      upsertCalled = true;
      return {};
    },
  });
  const result = await register({
    userId: 'wp6-dry-user',
    accountId: 'wp6-dry-account',
    password: 'dry-only',
    nickname: 'WP6 dry',
    role: 'writer',
  });

  if (!result.success || !upsertCalled) {
    throw new Error(result.error || 'addAccountAction DB contract dry 검증 실패');
  }
};

const verifyCafeRegistrationDry = async (context: CafeContext): Promise<void> => {
  const { buildCafeRegistrationUpdate } = await import('@/shared/lib/cafe-registration-harness');
  const { userId, cafe, cafeSlug } = context;
  const update = buildCafeRegistrationUpdate({
    userId,
    cafeId: cafe.cafeId,
    cafeUrl: cafeSlug,
    menuId: cafe.menuId,
    name: cafe.name,
    categories: cafe.categories,
    categoryMenuIds: cafe.categoryMenuIds,
    categoryAliases: cafe.categoryAliases,
    ownerAccountId: cafe.ownerAccountId,
  }, { preserveExistingDefault: true });

  if (!update.$set.isActive || update.$set.cafeUrl !== TARGET_CAFE_SLUG) {
    throw new Error('createCafeAction DB contract dry 검증 실패');
  }
};

const inspectCafeReadOnly = async (
  context: CafeContext,
  viewerAccount: AccountLike,
): Promise<string> => {
  const {
    acquireAccountLock,
    getPageForAccount,
    releaseAccountLock,
  } = await import('@/shared/lib/multi-session');
  const { cafe, cafeSlug } = context;

  await acquireAccountLock(viewerAccount.id);

  try {
    const page = await getPageForAccount(viewerAccount.id);
    await page.goto(`https://cafe.naver.com/${cafeSlug}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    });

    const apiUrl = new URL('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json');
    apiUrl.searchParams.set('search.clubid', cafe.cafeId);
    apiUrl.searchParams.set('search.page', '1');
    apiUrl.searchParams.set('search.perPage', '20');
    apiUrl.searchParams.set('search.queryType', 'lastArticle');
    apiUrl.searchParams.set('search.boardtype', 'L');

    const articleList = await page.evaluate(async (url: string) => {
      const response = await fetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`ArticleListV2dot1 HTTP ${response.status}`);
      }
      const payload = await response.json() as {
        message?: {
          result?: {
            articleList?: Array<{
              articleId?: number;
              subject?: string;
              commentCount?: number;
            }>;
          };
        };
      };
      return payload.message?.result?.articleList ?? [];
    }, apiUrl.toString());

    const recentArticle = articleList.find(({ commentCount }) => Number(commentCount) > 0)
      ?? articleList[0];
    if (!recentArticle?.articleId) {
      throw new Error('최근 글을 찾지 못했습니다');
    }

    await page.goto(
      `https://cafe.naver.com/ca-fe/cafes/${cafe.cafeId}/articles/${recentArticle.articleId}`,
      { waitUntil: 'domcontentloaded', timeout: 20_000 },
    );
    const articleSelectorCount = await page.locator(
      '.ArticleTitle, .article_viewer, .se-main-container, .ContentRenderer',
    ).count();
    const commentSelectorCount = await page.locator(
      '.CommentBox, .CommentItem, .comment_area, .CommentWriter',
    ).count();

    const writeUrl =
      `https://cafe.naver.com/ca-fe/cafes/${cafe.cafeId}/articles/write` +
      `?boardType=L&menuId=${cafe.menuId}`;
    await page.goto(writeUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const editorSelectorCount = await page.locator(
      '.se-component-content, .se-section-text, .se-title-text, [contenteditable="true"]',
    ).count();
    const submitSelectorCount = await page.locator(
      'a.BaseButton--skinGreen, button.BaseButton--skinGreen, a.BaseButton',
    ).count();

    if (
      articleSelectorCount === 0
      || commentSelectorCount === 0
      || !page.url().includes('/articles/write')
      || editorSelectorCount === 0
      || submitSelectorCount === 0
    ) {
      throw new Error(
        `selector check failed: article=${articleSelectorCount}, comment=${commentSelectorCount}, ` +
        `editor=${editorSelectorCount}, submit=${submitSelectorCount}`,
      );
    }

    return `home/list/article/comment/write selectors valid; recentArticleId=${recentArticle.articleId}; submit click=0`;
  } finally {
    releaseAccountLock(viewerAccount.id);
  }
};

const sleep = async (durationMs: number): Promise<void> =>
  new Promise((resolveSleep) => {
    setTimeout(resolveSleep, durationMs);
  });

const waitForMatchingPostJob = async (
  queue: QueueLike,
  keyword: string,
): Promise<QueueJobLike> => {
  const deadline = Date.now() + QUEUE_WAIT_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const jobs = await queue.getJobs(
      ['waiting', 'delayed', 'active', 'completed', 'failed'],
      0,
      500,
      false,
    );
    const job = jobs.find(({ data }) =>
      data.type === 'post'
      && data.cafeId === TARGET_CAFE_ID
      && data.keyword === keyword);

    if (!job) {
      await sleep(QUEUE_POLL_INTERVAL_MS);
      continue;
    }

    const state = await job.getState();
    if (state === 'completed') {
      return job;
    }

    if (state === 'failed') {
      throw new Error(`post job failed: ${job.failedReason || 'unknown'}`);
    }

    await sleep(QUEUE_POLL_INTERVAL_MS);
  }

  throw new Error('post job timeout; queued job 상태를 확인하세요');
};

const waitForJobCompletion = async (job: QueueJobLike): Promise<QueueJobLike> => {
  const deadline = Date.now() + QUEUE_WAIT_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const state = await job.getState();
    if (state === 'completed') {
      return job;
    }

    if (state === 'failed') {
      throw new Error(`job failed: ${job.failedReason || 'unknown'}`);
    }

    await sleep(QUEUE_POLL_INTERVAL_MS);
  }

  throw new Error(`job timeout: ${String(job.id || 'unknown')}`);
};

const buildLivePostPreview = (runToken: string) => ({
  keyword: `WP6-E2E-${runToken}`,
  prompt: [
    '밥상노트 라이브 E2E 확인용 테스트 글을 작성한다.',
    `본문 첫 문장에 식별자 WP6-E2E-${runToken}를 그대로 포함한다.`,
    '광고나 구매 권유 없이 자동화 경로 확인용 짧은 안내문으로 작성한다.',
  ].join(' '),
  comment: `WP6 E2E 확인 댓글 ${runToken}`,
});

const verifySheetPublishRow = async (post: PublishedPostState): Promise<boolean> => {
  const { google } = await import('googleapis');
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    throw new Error('Google Sheets readback credentials missing');
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: OPERATIONS_SHEET_ID,
    range: PUBLISH_LOG_RANGE,
  });
  const rows = response.data.values ?? [];

  return rows.some((row, index) =>
    index > 0
    && String(row[1]) === TARGET_CAFE_ID
    && String(row[3]) === String(post.articleId)
    && String(row[4]) === post.articleUrl
    && String(row[6]) === post.writerAccount.id);
};

const verifyPublishedUi = async (
  viewerAccount: AccountLike,
  post: PublishedPostState,
  comment: PublishedCommentState,
): Promise<{ article: boolean; comment: boolean }> => {
  const {
    acquireAccountLock,
    getPageForAccount,
    releaseAccountLock,
  } = await import('@/shared/lib/multi-session');

  await acquireAccountLock(viewerAccount.id);

  try {
    const page = await getPageForAccount(viewerAccount.id);
    await page.goto(
      `https://cafe.naver.com/ca-fe/cafes/${TARGET_CAFE_ID}/articles/${post.articleId}`,
      { waitUntil: 'domcontentloaded', timeout: 20_000 },
    );
    const article = await page.locator(
      '.ArticleTitle, .article_viewer, .se-main-container, .ContentRenderer',
    ).count() > 0;
    const commentTexts = await page.locator('.CommentItem, .comment_area').allInnerTexts();
    const normalizedExpected = comment.content.replace(/\s+/g, ' ').trim();
    const commentFound = commentTexts.some((text) =>
      text.replace(/\s+/g, ' ').includes(normalizedExpected));

    return { article, comment: commentFound };
  } finally {
    releaseAccountLock(viewerAccount.id);
  }
};

const createLiveStepHandlers = (
  state: RuntimeState,
): Record<E2eStepId, E2eStepHandler> => {
  const runToken = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const preview = buildLivePostPreview(runToken);

  const handleAccountManagement = async (): Promise<E2eStepHandlerResult> => {
    const context = await loadCafeContext();
    state.context = context;

    if (context.writerAccounts.length === 0 || context.commenterAccounts.length === 0) {
      return {
        status: 'FAIL',
        detail: `DB roster invalid: writers=${context.writerAccounts.length}, commenters=${context.commenterAccounts.length}`,
      };
    }

    return {
      status: 'PASS',
      detail:
        `DB roster=${context.accounts.length}, writers=${context.writerAccounts.length}, ` +
        `commenters=${context.commenterAccounts.length}; cafeId+slug policy applied`,
    };
  };

  const handleAccountRegistrationDry = async (): Promise<E2eStepHandlerResult> => {
    await verifyAccountRegistrationDry();
    return {
      status: 'PASS',
      detail: 'addAccountAction DB seam dry 검증; DB write=0; 네이버 회원가입 out-of-scope',
    };
  };

  const handleCafeManagement = async (): Promise<E2eStepHandlerResult> => {
    const context = getRuntimeContext(state);
    const { isAccountLoggedIn } = await import('@/shared/lib/multi-session');
    const session = await selectStoredSessionAccount({
      accounts: [...context.writerAccounts, ...context.commenterAccounts],
      isAccountLoggedIn,
    });

    if (!session.account) {
      return {
        status: 'SKIP',
        detail:
          `Cafe config PASS (${context.cafe.cafeId}/${context.cafeSlug}); ${session.detail}`,
      };
    }

    state.viewerAccount = session.account;
    const uiDetail = await inspectCafeReadOnly(context, session.account);
    return {
      status: 'PASS',
      detail:
        `Cafe config=${context.cafe.cafeId}/${context.cafeSlug}; ${session.detail}; ${uiDetail}`,
    };
  };

  const handleCafeRegistrationDry = async (): Promise<E2eStepHandlerResult> => {
    const context = getRuntimeContext(state);
    await verifyCafeRegistrationDry(context);
    return {
      status: 'PASS',
      detail: 'createCafeAction DB seam dry 검증; DB write=0; 네이버 카페개설/CAPTCHA out-of-scope',
    };
  };

  const handleQueueManagement = async (): Promise<E2eStepHandlerResult> => {
    const context = getRuntimeContext(state);
    const { getQueueStatus } = await import('@/shared/lib/queue');
    const roster = [...context.writerAccounts, ...context.commenterAccounts].filter(
      ({ id }, index, items) => items.findIndex((account) => account.id === id) === index,
    );
    const statuses = await Promise.all(roster.map(async ({ id }) => {
      const { waiting, active, completed, failed, delayed } = await getQueueStatus(id);
      return `${id}: waiting=${waiting}, active=${active}, completed=${completed}, failed=${failed}, delayed=${delayed}`;
    }));

    return {
      status: 'PASS',
      detail: statuses.join(' | '),
    };
  };

  const handlePostWriting = async (): Promise<E2eStepHandlerResult> => {
    const context = getRuntimeContext(state);
    const writerAccount = context.writerAccounts[0];
    if (!writerAccount) {
      return { status: 'SKIP', detail: 'writer account missing' };
    }

    const { isAccountLoggedIn } = await import('@/shared/lib/multi-session');
    const session = await selectStoredSessionAccount({
      accounts: [writerAccount],
      isAccountLoggedIn,
    });
    if (!session.account) {
      return { status: 'SKIP', detail: session.detail };
    }

    const { isAccountActive } = await import('@/shared/lib/account-manager');
    if (!isAccountActive(writerAccount)) {
      return { status: 'SKIP', detail: 'writer inactive now; delayed live mutation not queued' };
    }

    console.log(
      `[WP6][DRY] post cafe=${TARGET_CAFE_SLUG}/${TARGET_CAFE_ID}, ` +
      `writer=${writerAccount.id}, keyword=${preview.keyword}, prompt=${preview.prompt}`,
    );

    const [{ addBatchToQueue }, { getTaskQueue }] = await Promise.all([
      import('@/features/auto-comment/batch/batch-queue'),
      import('@/shared/lib/queue'),
    ]);
    const batchResult = await addBatchToQueue({
      service: 'wp6-e2e',
      keywords: [preview.keyword],
      cafeId: context.cafe.cafeId,
      skipComments: true,
      contentPrompt: preview.prompt,
      attachImages: false,
    });

    if (!batchResult.success || batchResult.jobsAdded !== 1) {
      throw new Error(`addBatchToQueue failed: ${batchResult.message}`);
    }

    const queue = getTaskQueue(writerAccount.id) as unknown as QueueLike;
    const job = await waitForMatchingPostJob(queue, preview.keyword);
    const result = job.returnvalue;
    if (!result?.success || !result.articleId || !result.articleUrl) {
      throw new Error(result?.error || 'post result articleId/articleUrl missing');
    }

    state.publishedPost = {
      articleId: result.articleId,
      articleUrl: result.articleUrl,
      keyword: preview.keyword,
      writerAccount,
    };

    return {
      status: 'PASS',
      detail: `articleId=${result.articleId}; articleUrl=${result.articleUrl}`,
    };
  };

  const handleCommentWriting = async (): Promise<E2eStepHandlerResult> => {
    const context = getRuntimeContext(state);
    const post = state.publishedPost;
    if (!post) {
      return { status: 'SKIP', detail: 'post result missing; comment skipped' };
    }

    const commenterCandidates = context.commenterAccounts.filter(({ id }) =>
      id !== post.writerAccount.id);
    const { isAccountLoggedIn } = await import('@/shared/lib/multi-session');
    const session = await selectStoredSessionAccount({
      accounts: commenterCandidates,
      isAccountLoggedIn,
    });
    if (!session.account) {
      return { status: 'SKIP', detail: session.detail };
    }

    console.log(
      `[WP6][DRY] comment cafe=${TARGET_CAFE_SLUG}/${TARGET_CAFE_ID}, ` +
      `articleId=${post.articleId}, commenter=${session.account.id}, content=${preview.comment}`,
    );

    const { addTaskJob } = await import('@/shared/lib/queue');
    const job = await addTaskJob(session.account.id, {
      type: 'comment',
      accountId: session.account.id,
      userId: context.userId,
      cafeId: context.cafe.cafeId,
      articleId: post.articleId,
      content: preview.comment,
      keyword: preview.keyword,
    }, 0) as unknown as QueueJobLike | null;

    if (!job) {
      throw new Error('comment job duplicate or enqueue failed');
    }

    const completedJob = await waitForJobCompletion(job);
    if (!completedJob.returnvalue?.success) {
      throw new Error(completedJob.returnvalue?.error || 'comment job failed');
    }

    state.publishedComment = {
      content: preview.comment,
      commenterAccount: session.account,
    };

    return {
      status: 'PASS',
      detail: `articleId=${post.articleId}; commenter=${session.account.id}; comment=1`,
    };
  };

  const handlePostCommentVerification = async (): Promise<E2eStepHandlerResult> => {
    const post = state.publishedPost;
    const comment = state.publishedComment;
    const viewerAccount = state.viewerAccount ?? comment?.commenterAccount ?? post?.writerAccount;
    if (!post || !comment || !viewerAccount) {
      return { status: 'SKIP', detail: 'post/comment result missing; combined verification skipped' };
    }

    const [{ PublishedArticle }, uiResult, sheet] = await Promise.all([
      import('@/shared/models'),
      verifyPublishedUi(viewerAccount, post, comment),
      verifySheetPublishRow(post),
    ]);
    const storedArticle = await PublishedArticle.findOne({
      cafeId: TARGET_CAFE_ID,
      articleId: post.articleId,
    }).lean() as unknown as {
      articleUrl?: string;
      comments?: Array<{ accountId?: string; content?: string }>;
    } | null;
    const dbArticle = storedArticle?.articleUrl === post.articleUrl;
    const dbComment = Boolean(storedArticle?.comments?.some(({ accountId, content }) =>
      accountId === comment.commenterAccount.id && content === comment.content));
    const checks = {
      articleId: post.articleId > 0,
      articleUrl: Boolean(post.articleUrl),
      dbArticle,
      dbComment,
      sheet,
      uiArticle: uiResult.article,
      uiComment: uiResult.comment,
    };
    const passed = Object.values(checks).every(Boolean);

    return {
      status: passed ? 'PASS' : 'FAIL',
      detail: Object.entries(checks)
        .map(([name, value]) => `${name}=${value ? 'PASS' : 'FAIL'}`)
        .join(', '),
    };
  };

  return {
    'account-management': handleAccountManagement,
    'account-registration-dry': handleAccountRegistrationDry,
    'cafe-management': handleCafeManagement,
    'cafe-registration-dry': handleCafeRegistrationDry,
    'queue-management': handleQueueManagement,
    'post-writing': handlePostWriting,
    'comment-writing': handleCommentWriting,
    'post-comment-verification': handlePostCommentVerification,
  };
};

const renderSummary = (results: E2eStepResult[]): string =>
  results
    .map(({ label, status, detail }, index) =>
      `${index + 1}. [${status}] ${label} - ${detail}`)
    .join('\n');

const closeLiveResources = async (): Promise<void> => {
  const cleanupResults = await Promise.allSettled([
    import('@/shared/lib/queue').then(({ closeAllQueues }) => closeAllQueues()),
    import('@/shared/lib/multi-session').then(({ closeAllContexts }) => closeAllContexts()),
  ]);
  const cleanupFailure = cleanupResults.find(({ status }) => status === 'rejected');
  if (cleanupFailure?.status === 'rejected') {
    console.error('[WP6] cleanup failed:', cleanupFailure.reason);
  }
};

const isDirectExecution = (): boolean => {
  const entryPoint = process.argv[1];
  return Boolean(entryPoint && import.meta.url === pathToFileURL(resolve(entryPoint)).href);
};

const main = async (): Promise<void> => {
  const { default: dotenv } = await import('dotenv');
  dotenv.config({ path: '.env', quiet: true });
  dotenv.config({ path: '.env.local', quiet: true });

  const argv = process.argv.slice(2);
  const plan = buildE2ePlan(argv);
  const mode = isMutationConfirmed(argv) ? 'mutation confirmed' : 'read-only smoke';
  const state: RuntimeState = {};

  console.log(`[WP6] target=${TARGET_CAFE_NAME} (${TARGET_CAFE_SLUG}/${TARGET_CAFE_ID})`);
  console.log(`[WP6] mode=${mode}`);

  try {
    const results = await runE2ePlan(plan, createLiveStepHandlers(state));
    console.log(renderSummary(results));
    if (results.some(({ status }) => status === 'FAIL')) {
      process.exitCode = 1;
    }
  } finally {
    await closeLiveResources();
  }
};

if (isDirectExecution()) {
  void main()
    .catch((error) => {
      console.error('[WP6] fatal:', error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    })
    .finally(() => {
      process.exit(process.exitCode ?? 0);
    });
}
