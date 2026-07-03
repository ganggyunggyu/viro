import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { Account, PublishedArticle, User, WorkCafeArticle } from '../src/shared/models';

interface ScheduleArgs {
  loginId: string;
  collectionId: string;
  targetCommentCount: number;
  startDelayMin: number;
  globalGapSec: number;
  accountGapMin: number;
  excludeOwnerAccountsGlobal: boolean;
  excludeAccountIds: Set<string>;
  skipArticleKeys: Set<string>;
}

interface ArticleTarget {
  ownerName: string;
  cafeSlug: string;
  cafeUrl: string;
  cafeId: string;
  articleId: number;
  articleUrl: string;
  subject: string;
  commentCount: number;
  targetCommentCount: number;
  shortage: number;
  existingCommenterIds: string[];
}

interface CommenterAccount {
  accountId: string;
  nickname: string;
}

interface ScheduleRow {
  sequence: number;
  cafeSlug: string;
  ownerName: string;
  cafeId: string;
  articleId: number;
  articleUrl: string;
  subject: string;
  currentCommentCount: number;
  targetCommentCount: number;
  shortage: number;
  commentSlot: number;
  accountId: string;
  accountNickname: string;
  plannedRunAt: string;
  plannedRunAtKst: string;
}

const DEFAULT_LOGIN_ID = process.env.LOGIN_ID || '21lab';
const DEFAULT_TARGET_COMMENT_COUNT = 8;
const DEFAULT_START_DELAY_MIN = 90;
const DEFAULT_GLOBAL_GAP_SEC = 45;
const DEFAULT_ACCOUNT_GAP_MIN = 8;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const args = process.argv.slice(2);

const hasFlag = (flag: string): boolean => args.includes(flag);

const getArgValues = (name: string): string[] => {
  const prefix = `${name}=`;
  const values: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith(prefix)) {
      values.push(arg.slice(prefix.length));
      continue;
    }

    if (arg === name && args[index + 1]) {
      values.push(args[index + 1]);
      index += 1;
    }
  }

  return values.flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean);
};

const getArgValue = (name: string, fallback: string): string => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];

  return fallback;
};

const normalizeName = (value: string): string =>
  value
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, '')
    .trim();

const csvEscape = (value: unknown): string => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toKstDateTime = (date: Date): string =>
  new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ');

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}시간 ${minutes}분`;
};

const getArgs = (): ScheduleArgs => ({
  loginId: getArgValue('--login-id', DEFAULT_LOGIN_ID),
  collectionId: getArgValue('--collection-id', ''),
  targetCommentCount: Number(getArgValue('--target-comment-count', String(DEFAULT_TARGET_COMMENT_COUNT))),
  startDelayMin: Number(getArgValue('--start-delay-min', String(DEFAULT_START_DELAY_MIN))),
  globalGapSec: Number(getArgValue('--global-gap-sec', String(DEFAULT_GLOBAL_GAP_SEC))),
  accountGapMin: Number(getArgValue('--account-gap-min', String(DEFAULT_ACCOUNT_GAP_MIN))),
  excludeOwnerAccountsGlobal: hasFlag('--exclude-owner-accounts-global'),
  excludeAccountIds: new Set(getArgValues('--exclude-account-id')),
  skipArticleKeys: new Set(getArgValues('--skip-article')),
});

const getArticleKey = (cafeId: string, articleId: number): string => `${cafeId}:${articleId}`;

const resolveLatestCollectionId = async (requestedCollectionId: string): Promise<string> => {
  if (requestedCollectionId) return requestedCollectionId;

  const latest = await WorkCafeArticle.findOne({}, { latestCollectionId: 1 })
    .sort({ collectedAt: -1 })
    .lean<{ latestCollectionId?: string } | null>();

  if (!latest?.latestCollectionId) throw new Error('latest collection id not found');
  return latest.latestCollectionId;
};

const loadArticles = async (
  collectionId: string,
  targetCommentCount: number,
): Promise<ArticleTarget[]> => {
  const articles = await WorkCafeArticle.find(
    {
      latestCollectionId: collectionId,
      needsCommentWork: true,
      commentWorkStatus: { $in: ['pending', 'generated', 'queued'] },
    },
    {
      ownerName: 1,
      cafeSlug: 1,
      cafeUrl: 1,
      cafeId: 1,
      articleId: 1,
      articleUrl: 1,
      subject: 1,
      commentCount: 1,
      targetCommentCount: 1,
      writeDateTimestamp: 1,
    },
  )
    .sort({ cafeSlug: 1, articleId: -1 })
    .lean<Array<ArticleTarget & { writeDateTimestamp?: number }>>();

  const articleKeys = articles.map((article) => ({
    cafeId: article.cafeId,
    articleId: Number(article.articleId),
  }));
  const existingComments = await PublishedArticle.find(
    {
      $or: articleKeys,
    },
    {
      cafeId: 1,
      articleId: 1,
      comments: 1,
    },
  ).lean<Array<{ cafeId: string; articleId: number; comments?: Array<{ accountId?: string; type?: string }> }>>();

  const existingCommenterIdsByArticle = new Map<string, string[]>();
  for (const article of existingComments) {
    existingCommenterIdsByArticle.set(
      getArticleKey(article.cafeId, article.articleId),
      (article.comments || [])
        .filter((comment) => comment.type === 'comment' && comment.accountId)
        .map((comment) => String(comment.accountId)),
    );
  }

  return articles
    .map((article) => {
      const effectiveTarget = targetCommentCount || Number(article.targetCommentCount || DEFAULT_TARGET_COMMENT_COUNT);
      const commentCount = Number(article.commentCount || 0);
      const shortage = Math.max(0, effectiveTarget - commentCount);

      return {
        ownerName: article.ownerName,
        cafeSlug: article.cafeSlug,
        cafeUrl: article.cafeUrl,
        cafeId: article.cafeId,
        articleId: Number(article.articleId),
        articleUrl: article.articleUrl,
        subject: article.subject,
        commentCount,
        targetCommentCount: effectiveTarget,
        shortage,
        existingCommenterIds: existingCommenterIdsByArticle.get(
          getArticleKey(article.cafeId, Number(article.articleId)),
        ) || [],
      };
    })
    .filter((article) => article.shortage > 0);
};

const loadCommenters = async (loginId: string): Promise<CommenterAccount[]> => {
  const user = await User.findOne({ loginId, isActive: true })
    .select('userId')
    .lean<{ userId: string } | null>();

  if (!user) throw new Error(`user not found: ${loginId}`);

  const accounts = await Account.find({
    userId: user.userId,
    isActive: true,
    role: 'commenter',
  })
    .select('accountId nickname')
    .sort({ createdAt: 1 })
    .lean<Array<{ accountId: string; nickname?: string }>>();

  return accounts.map((account) => ({
    accountId: account.accountId,
    nickname: account.nickname || account.accountId,
  }));
};

const interleaveByCafe = (articles: ArticleTarget[]): ArticleTarget[] => {
  const grouped = new Map<string, ArticleTarget[]>();
  for (const article of articles) {
    const group = grouped.get(article.cafeSlug) || [];
    group.push(article);
    grouped.set(article.cafeSlug, group);
  }

  const cafeSlugs = Array.from(grouped.keys()).sort();
  const ordered: ArticleTarget[] = [];
  let cursor = 0;

  while (true) {
    let added = false;
    for (const cafeSlug of cafeSlugs) {
      const article = grouped.get(cafeSlug)?.[cursor];
      if (!article) continue;
      ordered.push(article);
      added = true;
    }

    if (!added) break;
    cursor += 1;
  }

  return ordered;
};

const pickAccount = (
  accounts: CommenterAccount[],
  article: ArticleTarget,
  usedAccountIds: Set<string>,
  accountNextAt: Map<string, number>,
  accountUsageCount: Map<string, number>,
  startAtMs: number,
  globalNextAt: number,
): { account: CommenterAccount; plannedAt: number } => {
  const ownerName = normalizeName(article.ownerName);
  const nonOwnerAccounts = accounts.filter((account) => normalizeName(account.nickname) !== ownerName);
  const freshAccounts = nonOwnerAccounts.filter((account) => !usedAccountIds.has(account.accountId));
  const candidates = freshAccounts.length > 0 ? freshAccounts : nonOwnerAccounts;

  if (candidates.length === 0) {
    throw new Error(`commenter candidates not found: ${article.cafeSlug}/${article.articleId}`);
  }

  const [picked] = candidates
    .map((account) => ({
      account,
      plannedAt: Math.max(globalNextAt, accountNextAt.get(account.accountId) || startAtMs),
      usage: accountUsageCount.get(account.accountId) || 0,
    }))
    .sort((a, b) =>
      a.plannedAt - b.plannedAt ||
      a.usage - b.usage ||
      a.account.accountId.localeCompare(b.account.accountId),
    );

  return { account: picked.account, plannedAt: picked.plannedAt };
};

const buildSchedule = (
  articles: ArticleTarget[],
  accounts: CommenterAccount[],
  options: {
    startAtMs: number;
    globalGapMs: number;
    accountGapMs: number;
  },
): ScheduleRow[] => {
  if (accounts.length === 0) throw new Error('commenter accounts not found');

  const articleOrder = interleaveByCafe(articles);
  const maxShortage = Math.max(...articleOrder.map((article) => article.shortage));
  const accountNextAt = new Map<string, number>();
  const accountUsageCount = new Map<string, number>();
  const usedAccountsByArticle = new Map<string, Set<string>>();
  const rows: ScheduleRow[] = [];
  let globalNextAt = options.startAtMs;

  for (let round = 1; round <= maxShortage; round += 1) {
    for (const article of articleOrder) {
      if (article.shortage < round) continue;

      const articleKey = `${article.cafeId}:${article.articleId}`;
      const usedAccountIds = usedAccountsByArticle.get(articleKey) || new Set<string>(article.existingCommenterIds);
      const { account, plannedAt } = pickAccount(
        accounts,
        article,
        usedAccountIds,
        accountNextAt,
        accountUsageCount,
        options.startAtMs,
        globalNextAt,
      );
      const plannedDate = new Date(plannedAt);

      rows.push({
        sequence: rows.length + 1,
        cafeSlug: article.cafeSlug,
        ownerName: article.ownerName,
        cafeId: article.cafeId,
        articleId: article.articleId,
        articleUrl: article.articleUrl,
        subject: article.subject,
        currentCommentCount: article.commentCount,
        targetCommentCount: article.targetCommentCount,
        shortage: article.shortage,
        commentSlot: article.commentCount + round,
        accountId: account.accountId,
        accountNickname: account.nickname,
        plannedRunAt: plannedDate.toISOString(),
        plannedRunAtKst: toKstDateTime(plannedDate),
      });

      usedAccountIds.add(account.accountId);
      usedAccountsByArticle.set(articleKey, usedAccountIds);
      accountNextAt.set(account.accountId, plannedAt + options.accountGapMs);
      accountUsageCount.set(
        account.accountId,
        (accountUsageCount.get(account.accountId) || 0) + 1,
      );
      globalNextAt = plannedAt + options.globalGapMs;
    }
  }

  return rows;
};

const summarizeByCafe = (articles: ArticleTarget[], schedule: ScheduleRow[]): Array<Record<string, unknown>> => {
  const articleCounts = new Map<string, { ownerName: string; articles: number; zeroArticles: number; shortage: number }>();
  for (const article of articles) {
    const current = articleCounts.get(article.cafeSlug) || {
      ownerName: article.ownerName,
      articles: 0,
      zeroArticles: 0,
      shortage: 0,
    };
    current.articles += 1;
    current.zeroArticles += article.commentCount === 0 ? 1 : 0;
    current.shortage += article.shortage;
    articleCounts.set(article.cafeSlug, current);
  }

  const scheduledCounts = schedule.reduce((acc, row) => {
    acc.set(row.cafeSlug, (acc.get(row.cafeSlug) || 0) + 1);
    return acc;
  }, new Map<string, number>());

  return Array.from(articleCounts.entries()).map(([cafeSlug, value]) => ({
    cafeSlug,
    ownerName: value.ownerName,
    pendingArticles: value.articles,
    zeroArticles: value.zeroArticles,
    shortage: value.shortage,
    scheduledComments: scheduledCounts.get(cafeSlug) || 0,
  }));
};

const summarizeByAccount = (schedule: ScheduleRow[]): Array<Record<string, unknown>> => {
  const counts = schedule.reduce((acc, row) => {
    const current = acc.get(row.accountId) || {
      accountId: row.accountId,
      nickname: row.accountNickname,
      scheduledComments: 0,
    };
    current.scheduledComments += 1;
    acc.set(row.accountId, current);
    return acc;
  }, new Map<string, { accountId: string; nickname: string; scheduledComments: number }>());

  return Array.from(counts.values()).sort((a, b) =>
    b.scheduledComments - a.scheduledComments ||
    a.accountId.localeCompare(b.accountId),
  );
};

const writeArtifacts = (payload: {
  generatedAt: string;
  collectionId: string;
  loginId: string;
  targetCommentCount: number;
  scheduleOptions: Record<string, unknown>;
  totals: Record<string, unknown>;
  estimates: Record<string, string>;
  byCafe: Array<Record<string, unknown>>;
  byAccount: Array<Record<string, unknown>>;
  ownerMatchedAccounts: CommenterAccount[];
  excludedOwnerAccounts: CommenterAccount[];
  schedule: ScheduleRow[];
}): { jsonPath: string; csvPath: string; mdPath: string } => {
  const outputDir = join(process.cwd(), 'outputs');
  mkdirSync(outputDir, { recursive: true });
  const timestamp = payload.generatedAt.replace(/[:.]/g, '-');
  const jsonPath = join(outputDir, `work-cafe-comment-schedule-${timestamp}.json`);
  const csvPath = join(outputDir, `work-cafe-comment-schedule-${timestamp}.csv`);
  const mdPath = join(outputDir, `work-cafe-comment-execution-hold-${timestamp}.md`);

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');
  writeFileSync(
    csvPath,
    [
      [
        'sequence',
        'plannedRunAtKst',
        'cafeSlug',
        'ownerName',
        'articleId',
        'commentSlot',
        'accountId',
        'accountNickname',
        'subject',
        'articleUrl',
      ].join(','),
      ...payload.schedule.map((row) =>
        [
          row.sequence,
          row.plannedRunAtKst,
          row.cafeSlug,
          row.ownerName,
          row.articleId,
          row.commentSlot,
          row.accountId,
          row.accountNickname,
          row.subject,
          row.articleUrl,
        ].map(csvEscape).join(','),
      ),
      '',
    ].join('\n'),
    'utf-8',
  );

  writeFileSync(
    mdPath,
    [
      '# 작업카페 댓글 실행 보류 기록',
      '',
      '상태: 실행 보류. 사용자 명시 승인 전 댓글 생성 API 대량 호출, 큐 등록, 네이버 댓글 작성 금지.',
      '',
      '## 현재 기준',
      '',
      `- generatedAt: ${payload.generatedAt}`,
      `- collectionId: ${payload.collectionId}`,
      `- loginId: ${payload.loginId}`,
      `- targetCommentCount: ${payload.targetCommentCount}`,
      `- pendingArticles: ${payload.totals.pendingArticles}`,
      `- totalCommentShortage: ${payload.totals.totalComments}`,
      `- commenterAccounts: ${payload.totals.commenterAccounts}`,
      `- ownerMatchedAccounts: ${payload.totals.ownerMatchedAccounts}`,
      `- excludedOwnerAccounts: ${payload.totals.excludedOwnerAccounts}`,
      `- ownerExclusionMode: ${payload.scheduleOptions.ownerExclusionMode}`,
      `- plannedWindow: ${payload.estimates.plannedWindow}`,
      `- generationEstimate: ${payload.estimates.generationEstimate}`,
      '',
      '## 스케줄 정책',
      '',
      `- 시작: 실행 승인 후 ${payload.scheduleOptions.startDelayMin}분 뒤로 계산`,
      `- 전역 댓글 간격: ${payload.scheduleOptions.globalGapSec}초`,
      `- 계정별 최소 간격: ${payload.scheduleOptions.accountGapMin}분`,
      '- 같은 글에는 같은 계정을 중복 배정하지 않음',
      payload.scheduleOptions.ownerExclusionMode === 'global'
        ? '- 카페장 닉네임과 같은 댓글러는 전체 댓글 스케줄에서 제외'
        : '- 카페장 닉네임과 같은 댓글러는 자기 카페 글에서만 제외',
      '- 글별 댓글을 8개 연속으로 몰지 않고 전체 글 1회차, 2회차 방식으로 분산',
      '',
      payload.scheduleOptions.ownerExclusionMode === 'global'
        ? '## 제외된 카페장 계정'
        : '## 카페장 계정 처리',
      '',
      ...(payload.scheduleOptions.ownerExclusionMode === 'global'
        ? [
            '|계정|닉네임|',
            '|---|---|',
            ...payload.excludedOwnerAccounts.map((account) =>
              `|${account.accountId}|${account.nickname}|`,
            ),
          ]
        : [
            '카페장 계정은 댓글러 풀에 포함하되, 자기 카페 글에는 배정하지 않는다.',
            '',
            '|계정|닉네임|처리|',
            '|---|---|---|',
            ...payload.ownerMatchedAccounts.map((account) =>
              `|${account.accountId}|${account.nickname}|자기 카페만 제외|`,
            ),
          ]),
      '',
      '## 예상 소요시간',
      '',
      `- 30초/댓글 기준: ${payload.estimates.serial30s}`,
      `- 45초/댓글 기준: ${payload.estimates.serial45s}`,
      `- 60초/댓글 기준: ${payload.estimates.serial60s}`,
      `- 90초/댓글 기준: ${payload.estimates.serial90s}`,
      '',
      '## 카페별 물량',
      '',
      '|카페|카페장|대상글|댓글0글|필요댓글|',
      '|---|---|---:|---:|---:|',
      ...payload.byCafe.map((row) =>
        `|${row.cafeSlug}|${row.ownerName}|${row.pendingArticles}|${row.zeroArticles}|${row.shortage}|`,
      ),
      '',
      '## 승인 후 실행 순서',
      '',
      '1. 최신 댓글 수를 다시 수집한다.',
      '',
      '```bash',
      'npx tsx --env-file=.env.local scripts/collect-work-cafe-zero-comment-posts.ts --login-id=21lab --account-id=vegetable10517 --per-page=20 --max-pages=30',
      '```',
      '',
      '2. 새 수집 JSON을 DB에 반영하고 프롬프트를 갱신한다.',
      '',
      '```bash',
      'npx tsx --env-file=.env.local scripts/persist-work-cafe-comment-targets.ts --source=outputs/work-cafe-zero-comment-posts-<NEW_TIMESTAMP>.json --target-comment-count=8',
      '```',
      '',
      '3. 스케줄을 재생성한다.',
      '',
      '```bash',
      'npx tsx --env-file=.env.local scripts/build-work-cafe-comment-schedule.ts --login-id=21lab --target-comment-count=8 --start-delay-min=90 --global-gap-sec=45 --account-gap-min=8',
      '```',
      '',
      '4. 댓글 생성/큐 등록은 별도 승인 문구를 받은 뒤에만 진행한다.',
      '',
      '## 산출물',
      '',
      `- JSON: ${jsonPath}`,
      `- CSV: ${csvPath}`,
      `- MD: ${mdPath}`,
      '',
    ].join('\n'),
    'utf-8',
  );

  return { jsonPath, csvPath, mdPath };
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  const options = getArgs();
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  const collectionId = await resolveLatestCollectionId(options.collectionId);
  const [articles, allCommenters] = await Promise.all([
    loadArticles(collectionId, options.targetCommentCount),
    loadCommenters(options.loginId),
  ]);
  const ownerNames = new Set(articles.map((article) => normalizeName(article.ownerName)));
  const ownerMatchedAccounts = allCommenters.filter((account) =>
    ownerNames.has(normalizeName(account.nickname)),
  );
  const accounts = options.excludeOwnerAccountsGlobal
    ? allCommenters.filter((account) => !ownerNames.has(normalizeName(account.nickname)))
    : allCommenters;
  const filteredAccounts = accounts.filter((account) => !options.excludeAccountIds.has(account.accountId));
  const excludedOwnerAccounts = options.excludeOwnerAccountsGlobal ? ownerMatchedAccounts : [];
  const articlesToSchedule = articles.filter(
    (article) => !options.skipArticleKeys.has(getArticleKey(article.cafeId, article.articleId)),
  );
  const startAtMs = Date.now() + options.startDelayMin * 60_000;
  const schedule = buildSchedule(articlesToSchedule, filteredAccounts, {
    startAtMs,
    globalGapMs: options.globalGapSec * 1000,
    accountGapMs: options.accountGapMin * 60_000,
  });
  const firstRunAt = schedule[0] ? new Date(schedule[0].plannedRunAt) : null;
  const lastRunAt = schedule.at(-1) ? new Date(schedule.at(-1)!.plannedRunAt) : null;
  const totalComments = schedule.length;
  const plannedWindowMs = firstRunAt && lastRunAt ? lastRunAt.getTime() - firstRunAt.getTime() : 0;
  const generatedAt = new Date().toISOString();
  const paths = writeArtifacts({
    generatedAt,
    collectionId,
    loginId: options.loginId,
    targetCommentCount: options.targetCommentCount,
    scheduleOptions: {
      startDelayMin: options.startDelayMin,
      globalGapSec: options.globalGapSec,
      accountGapMin: options.accountGapMin,
      ownerExclusionMode: options.excludeOwnerAccountsGlobal ? 'global' : 'own-cafe-only',
      excludeAccountIds: Array.from(options.excludeAccountIds),
      skipArticleKeys: Array.from(options.skipArticleKeys),
      firstRunAtKst: firstRunAt ? toKstDateTime(firstRunAt) : '',
      lastRunAtKst: lastRunAt ? toKstDateTime(lastRunAt) : '',
    },
    totals: {
      pendingArticles: articlesToSchedule.length,
      totalComments,
      commenterAccounts: filteredAccounts.length,
      excludedOwnerAccounts: options.excludeOwnerAccountsGlobal ? excludedOwnerAccounts.length : 0,
      excludedManualAccounts: options.excludeAccountIds.size,
      skippedArticles: articles.length - articlesToSchedule.length,
      ownerMatchedAccounts: ownerMatchedAccounts.length,
    },
    estimates: {
      plannedWindow: formatDuration(plannedWindowMs),
      generationEstimate: '40~90분',
      serial30s: formatDuration(Math.max(0, totalComments - 1) * 30_000),
      serial45s: formatDuration(Math.max(0, totalComments - 1) * 45_000),
      serial60s: formatDuration(Math.max(0, totalComments - 1) * 60_000),
      serial90s: formatDuration(Math.max(0, totalComments - 1) * 90_000),
    },
    byCafe: summarizeByCafe(articlesToSchedule, schedule),
    byAccount: summarizeByAccount(schedule),
    ownerMatchedAccounts,
    excludedOwnerAccounts,
    schedule,
  });

  console.log('work cafe comment schedule recorded');
  console.log(`collectionId: ${collectionId}`);
  console.log(`pendingArticles: ${articles.length}`);
  console.log(`totalComments: ${totalComments}`);
  console.log(`commenterAccounts: ${accounts.length}`);
  console.log(`excludedOwnerAccounts: ${excludedOwnerAccounts.length}`);
  console.log(`plannedWindow: ${formatDuration(plannedWindowMs)}`);
  console.log(`json: ${paths.jsonPath}`);
  console.log(`csv: ${paths.csvPath}`);
  console.log(`md: ${paths.mdPath}`);
};

main()
  .catch((error) => {
    console.error('build-work-cafe-comment-schedule failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(process.exitCode || 0);
  });
