import { appendFileSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import type { ElementHandle, Frame, Page } from 'playwright';
import mongoose from 'mongoose';
import type { NaverAccount } from '../src/shared/lib/account-manager';
import { readCafeArticleContent } from '../src/shared/lib/cafe-article-reader';
import {
  acquireAccountLock,
  closeAllContexts,
  getPageForAccount,
  releaseAccountLock,
  warmupScheduleSessions,
} from '../src/shared/lib/multi-session';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { generateCafeCommentBatch } from '../src/shared/api/cafe-comment-batch-api';
import { Account, User, WorkCafeArticle, PublishedArticle, addCommentToArticle } from '../src/shared/models';
import { getArticleComments, hasCommented } from '../src/shared/models/published-article';

interface RunnerArgs {
  schedulePath: string;
  loginId: string;
  model: string;
  accountGapMin: number;
  globalGapSec: number;
  articleGapMin: number;
  startDelaySec: number;
  maxActive: number;
  generationConcurrency: number;
  prefetchArticles: number;
  backgroundPrefetchArticles: number;
  screenshotEvery: number;
  loginWaitMin: number;
  canarySuccessTarget: number;
  canaryMaxAttempts: number;
  canaryMaxActive: number;
  canaryLaunchGapSec: number;
  onlyAccountIds: Set<string>;
  excludeAccountIds: Set<string>;
  excludePairs: Set<string>;
  onlyArticleKeys: Set<string>;
  skipArticleKeys: Set<string>;
  skipWarmup: boolean;
  accountWorkers: boolean;
  articleBatches: boolean;
  limit: number;
  dryRun: boolean;
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

interface SchedulePayload {
  generatedAt: string;
  collectionId: string;
  loginId: string;
  schedule: ScheduleRow[];
}

interface RuntimeTask {
  row: ScheduleRow;
  articleKey: string;
  articleCommentIndex: number;
  dueAtMs: number;
  dueAtKst: string;
}

interface GeneratedArticle {
  articleKey: string;
  cafeId: string;
  articleId: number;
  title: string;
  bodyLength: number;
  comments: Array<{
    index: number;
    content: string;
    persona: string;
    intent: string;
  }>;
  warnings: string[];
  readerAccountId: string;
  generatedAt: string;
}

interface ScreenshotRecord {
  path: string;
  cafeId: string;
  articleId: number;
  accountId: string;
  commentCount: number;
  capturedAt: string;
}

interface RunnerState {
  runId: string;
  totalTasks: number;
  launched: number;
  success: number;
  failed: number;
  skipped: number;
  generatedArticles: number;
  generationFailed: number;
  screenshots: ScreenshotRecord[];
  startedAt: string;
  endedAt?: string;
}

type TaskOutcome = 'success' | 'failed' | 'skipped';

class Semaphore {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly limit: number) {}

  run = async <T>(fn: () => Promise<T>): Promise<T> => {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  };

  private acquire = async (): Promise<void> => {
    if (this.active < this.limit) {
      this.active += 1;
      return;
    }

    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
    this.active += 1;
  };

  private release = (): void => {
    this.active -= 1;
    const next = this.queue.shift();
    if (next) next();
  };
}

const args = process.argv.slice(2);
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const getArgValue = (name: string, fallback: string): string => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];

  return fallback;
};

const hasFlag = (flag: string): boolean => args.includes(flag);

const getArgValues = (name: string): string[] => {
  const values: string[] = [];
  const prefix = `${name}=`;

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

const toKstDateTime = (date: Date): string =>
  new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 19).replace('T', ' ');

const sleep = (ms: number): Promise<void> =>
  new Promise((resolveSleep) => setTimeout(resolveSleep, Math.max(0, ms)));

const normalizeName = (value: string): string =>
  value
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, '')
    .trim();

const safeFilePart = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);

const normalizeCommentContent = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const getArticleKey = (row: Pick<ScheduleRow, 'cafeId' | 'articleId'>): string =>
  `${row.cafeId}:${row.articleId}`;

const getPairKeys = (row: Pick<ScheduleRow, 'accountId' | 'cafeId' | 'cafeSlug'>): string[] => [
  `${row.accountId}:${row.cafeId}`,
  `${row.accountId}:${row.cafeSlug}`,
];

const isRuntimePairBlockError = (errorMessage: string): boolean =>
  errorMessage.includes('ARTICLE_NOT_READY') ||
  errorMessage.includes('댓글 입력창을 찾을 수 없습니다') ||
  errorMessage.includes('로그인 대기 시간 초과') ||
  errorMessage.includes('캡차 풀이 실패');

const findLatestSchedulePath = (): string => {
  const outputDir = join(process.cwd(), 'outputs');
  const candidates = readdirSync(outputDir)
    .filter((name) => /^work-cafe-comment-schedule-.*\.json$/.test(name))
    .map((name) => {
      const path = join(outputDir, name);
      return { path, mtimeMs: statSync(path).mtimeMs };
    });

  if (candidates.length === 0) {
    throw new Error('work cafe comment schedule artifact not found');
  }

  return candidates
    .sort((a, b) => b.mtimeMs - a.mtimeMs || b.path.localeCompare(a.path))[0]
    .path;
};

const getArgs = (): RunnerArgs => ({
  schedulePath: getArgValue('--schedule', findLatestSchedulePath()),
  loginId: getArgValue('--login-id', '21lab'),
  model: getArgValue('--model', 'deepseek-v4-flash'),
  accountGapMin: Number(getArgValue('--account-gap-min', '3')),
  globalGapSec: Number(getArgValue('--global-gap-sec', '10')),
  articleGapMin: Number(getArgValue('--article-gap-min', '25')),
  startDelaySec: Number(getArgValue('--start-delay-sec', '0')),
  maxActive: Number(getArgValue('--max-active', '20')),
  generationConcurrency: Number(getArgValue('--generation-concurrency', '4')),
  prefetchArticles: Number(getArgValue('--prefetch-articles', '0')),
  backgroundPrefetchArticles: Number(getArgValue('--background-prefetch-articles', '0')),
  screenshotEvery: Number(getArgValue('--screenshot-every', '25')),
  loginWaitMin: Number(getArgValue('--login-wait-min', '10')),
  canarySuccessTarget: Number(getArgValue('--canary-success-target', '10')),
  canaryMaxAttempts: Number(getArgValue('--canary-max-attempts', '40')),
  canaryMaxActive: Number(getArgValue('--canary-max-active', '3')),
  canaryLaunchGapSec: Number(getArgValue('--canary-launch-gap-sec', '2')),
  onlyAccountIds: new Set(getArgValues('--account-id')),
  excludeAccountIds: new Set(getArgValues('--exclude-account-id')),
  excludePairs: new Set(getArgValues('--exclude-pair')),
  onlyArticleKeys: new Set([...getArgValues('--article'), ...getArgValues('--only-article')]),
  skipArticleKeys: new Set(getArgValues('--skip-article')),
  skipWarmup: hasFlag('--skip-warmup'),
  accountWorkers: hasFlag('--account-workers'),
  articleBatches: hasFlag('--article-batches'),
  limit: Number(getArgValue('--limit', '0')),
  dryRun: hasFlag('--dry-run'),
});

const loadSchedule = (
  schedulePath: string,
  options: Pick<
    RunnerArgs,
    'limit' | 'onlyAccountIds' | 'excludeAccountIds' | 'excludePairs' | 'onlyArticleKeys' | 'skipArticleKeys'
  >,
): SchedulePayload => {
  const payload = JSON.parse(readFileSync(resolve(schedulePath), 'utf-8')) as SchedulePayload;
  const schedule = [...payload.schedule]
    .filter((row) => {
      if (options.onlyAccountIds.size > 0 && !options.onlyAccountIds.has(row.accountId)) return false;
      if (options.excludeAccountIds.has(row.accountId)) return false;
      if (getPairKeys(row).some((pairKey) => options.excludePairs.has(pairKey))) return false;
      if (options.onlyArticleKeys.size > 0 && !options.onlyArticleKeys.has(getArticleKey(row))) return false;
      if (options.skipArticleKeys.has(getArticleKey(row))) return false;
      return true;
    })
    .sort((a, b) => a.sequence - b.sequence);
  return {
    ...payload,
    schedule: options.limit > 0 ? schedule.slice(0, options.limit) : schedule,
  };
};

const verifyOwnerExclusion = (schedule: ScheduleRow[]): void => {
  const violations = schedule.filter(
    (row) => normalizeName(row.ownerName) === normalizeName(row.accountNickname),
  );

  if (violations.length > 0) {
    const sample = violations
      .slice(0, 5)
      .map((row) => `${row.cafeSlug}/${row.articleId}/${row.accountNickname}`)
      .join(', ');
    throw new Error(`카페장 자기 카페 댓글 배정 발견: ${violations.length}건 (${sample})`);
  }
};

const groupRowsByArticle = (schedule: ScheduleRow[]): Map<string, ScheduleRow[]> => {
  const grouped = new Map<string, ScheduleRow[]>();

  for (const row of schedule) {
    const key = getArticleKey(row);
    const rows = grouped.get(key) ?? [];
    rows.push(row);
    grouped.set(key, rows);
  }

  for (const rows of grouped.values()) {
    rows.sort((a, b) => a.sequence - b.sequence);
  }

  return grouped;
};

const filterRunnableSchedule = async (
  schedule: ScheduleRow[],
): Promise<{
  schedule: ScheduleRow[];
  skippedAlreadyCommented: number;
}> => {
  const articleRows = groupRowsByArticle(schedule);
  const commentedAccountsByArticle = new Map<string, Set<string>>();

  await Promise.all(
    Array.from(articleRows.entries()).map(async ([articleKey, rows]) => {
      const firstRow = rows[0];
      const comments = await getArticleComments(firstRow.cafeId, firstRow.articleId);
      commentedAccountsByArticle.set(
        articleKey,
        new Set(
          comments
            .filter((comment) => comment.type === 'comment')
            .map((comment) => comment.accountId),
        ),
      );
    }),
  );

  let skippedAlreadyCommented = 0;
  const runnableSchedule = schedule.filter((row) => {
    const commentedAccounts = commentedAccountsByArticle.get(getArticleKey(row));
    const alreadyCommented = commentedAccounts?.has(row.accountId) ?? false;
    if (alreadyCommented) skippedAlreadyCommented += 1;
    return !alreadyCommented;
  });

  return {
    schedule: runnableSchedule,
    skippedAlreadyCommented,
  };
};

const buildRuntimePlan = (
  schedule: ScheduleRow[],
  articleGroups: Map<string, ScheduleRow[]>,
  options: RunnerArgs,
): RuntimeTask[] => {
  const startAtMs = Date.now() + options.startDelaySec * 1000;
  const accountNextAt = new Map<string, number>();
  const articleNextAt = new Map<string, number>();
  const articleIndexes = new Map<number, number>();
  const tasks: RuntimeTask[] = [];
  let globalNextAt = startAtMs;

  for (const rows of articleGroups.values()) {
    rows.forEach((row, index) => articleIndexes.set(row.sequence, index));
  }

  for (const row of schedule) {
    const articleKey = getArticleKey(row);
    const dueAtMs = Math.max(
      globalNextAt,
      accountNextAt.get(row.accountId) ?? startAtMs,
      articleNextAt.get(articleKey) ?? startAtMs,
    );

    tasks.push({
      row,
      articleKey,
      articleCommentIndex: articleIndexes.get(row.sequence) ?? 0,
      dueAtMs,
      dueAtKst: toKstDateTime(new Date(dueAtMs)),
    });

    globalNextAt = dueAtMs + options.globalGapSec * 1000;
    accountNextAt.set(row.accountId, dueAtMs + options.accountGapMin * 60_000);
    articleNextAt.set(articleKey, dueAtMs + options.articleGapMin * 60_000);
  }

  return tasks;
};

const loadAccounts = async (
  loginId: string,
  requiredAccountIds: Set<string>,
): Promise<Map<string, NaverAccount>> => {
  const user = await User.findOne({ loginId, isActive: true })
    .select('userId')
    .lean<{ userId: string } | null>();

  if (!user) throw new Error(`user not found: ${loginId}`);

  const docs = await Account.find({
    userId: user.userId,
    isActive: true,
    accountId: { $in: Array.from(requiredAccountIds) },
  })
    .select('accountId password nickname role activityHours restDays dailyPostLimit personaId')
    .lean<Array<{
      accountId: string;
      password: string;
      nickname?: string;
      role?: 'writer' | 'commenter';
      activityHours?: { start: number; end: number };
      restDays?: number[];
      dailyPostLimit?: number;
      personaId?: string;
    }>>();

  const accounts = new Map<string, NaverAccount>();
  for (const doc of docs) {
    accounts.set(doc.accountId, {
      id: doc.accountId,
      password: doc.password,
      nickname: doc.nickname || doc.accountId,
      role: doc.role,
      activityHours: doc.activityHours,
      restDays: doc.restDays,
      dailyPostLimit: doc.dailyPostLimit,
      personaId: doc.personaId,
    });
  }

  const missing = Array.from(requiredAccountIds).filter((accountId) => !accounts.has(accountId));
  if (missing.length > 0) {
    throw new Error(`schedule account not found or inactive: ${missing.join(', ')}`);
  }

  return accounts;
};

const appendJsonl = (path: string, payload: Record<string, unknown>): void => {
  appendFileSync(path, `${JSON.stringify(payload)}\n`, 'utf-8');
};

const writeSummary = (
  summaryPath: string,
  state: RunnerState,
  options: RunnerArgs,
  runtimePlan: RuntimeTask[],
): void => {
  const now = new Date();
  const nextPending = runtimePlan.find((task) => task.dueAtMs > Date.now());
  const lines = [
    '# 작업카페 댓글 실행 현황',
    '',
    `- runId: ${state.runId}`,
    `- updatedAtKst: ${toKstDateTime(now)}`,
    `- schedule: ${options.schedulePath}`,
    `- totalTasks: ${state.totalTasks}`,
    `- launched: ${state.launched}`,
    `- success: ${state.success}`,
    `- failed: ${state.failed}`,
    `- skipped: ${state.skipped}`,
    `- generatedArticles: ${state.generatedArticles}`,
    `- generationFailed: ${state.generationFailed}`,
    `- accountGapMin: ${options.accountGapMin}`,
    `- globalGapSec: ${options.globalGapSec}`,
    `- articleGapMin: ${options.articleGapMin}`,
    `- maxActive: ${options.maxActive}`,
    `- nextDueKst: ${nextPending?.dueAtKst ?? ''}`,
    '',
    '## UI 캡처',
    '',
    ...state.screenshots.slice(-10).map((shot) =>
      `- ${shot.capturedAt} ${shot.accountId} ${shot.cafeId}/${shot.articleId} comments=${shot.commentCount} ${shot.path}`,
    ),
    '',
  ];

  writeFileSync(summaryPath, lines.join('\n'), 'utf-8');
};

const getArticleRoot = async (page: Page): Promise<Page | Frame> => {
  try {
    await page.waitForSelector('iframe#cafe_main', { timeout: 10_000 });
  } catch {
    return page;
  }

  const frameHandle = await page.$('iframe#cafe_main');
  const frame = await frameHandle?.contentFrame();
  return frame ?? page;
};

const countTopLevelComments = async (root: Page | Frame): Promise<number> => {
  const items = await root.$$('.CommentItem:not(.CommentItem--reply)');
  return items.length;
};

const pickScreenshotElement = async (
  root: Page | Frame,
): Promise<ElementHandle<SVGElement | HTMLElement> | null> => {
  const selectors = [
    '.CommentBox',
    '.ArticleComment',
    '.comment_list',
    '.CommentList',
    '.ArticleContentBox',
  ];

  for (const selector of selectors) {
    const element = await root.$(selector);
    if (element) return element;
  }

  return null;
};

const captureCommentUi = async (params: {
  accountId: string;
  cafeId: string;
  articleId: number;
  outputDir: string;
  sequence: number;
}): Promise<ScreenshotRecord> => {
  const { accountId, cafeId, articleId, outputDir, sequence } = params;
  await acquireAccountLock(accountId);

  try {
    const page = await getPageForAccount(accountId);
    const url = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });
    await page.waitForTimeout(1800);

    const root = await getArticleRoot(page);
    const commentCount = await countTopLevelComments(root);
    const path = join(
      outputDir,
      `${String(sequence).padStart(5, '0')}-${safeFilePart(accountId)}-${cafeId}-${articleId}.png`,
    );
    const element = await pickScreenshotElement(root);

    if (element) {
      await element.screenshot({ path });
    } else {
      await page.screenshot({ path, fullPage: true });
    }

    return {
      path,
      cafeId,
      articleId,
      accountId,
      commentCount,
      capturedAt: toKstDateTime(new Date()),
    };
  } finally {
    releaseAccountLock(accountId);
  }
};

const createArticleGenerator = (params: {
  articleGroups: Map<string, ScheduleRow[]>;
  accounts: Map<string, NaverAccount>;
  options: RunnerArgs;
  generationLogPath: string;
  state: RunnerState;
}): {
  startAll: () => void;
  getGeneratedArticle: (articleKey: string) => Promise<GeneratedArticle>;
} => {
  const { articleGroups, accounts, options, generationLogPath, state } = params;
  const limiter = new Semaphore(Math.max(1, options.generationConcurrency));
  const promises = new Map<string, Promise<GeneratedArticle>>();

  const generateArticle = async (articleKey: string): Promise<GeneratedArticle> => {
    const rows = articleGroups.get(articleKey);
    if (!rows?.length) throw new Error(`article rows not found: ${articleKey}`);

    const firstRow = rows[0];
    const readerAccounts = Array.from(new Set(rows.map((row) => row.accountId)))
      .map((accountId) => accounts.get(accountId))
      .filter((account): account is NaverAccount => Boolean(account));
    if (readerAccounts.length === 0) {
      throw new Error(`reader account not found: ${rows.map((row) => row.accountId).join(',')}`);
    }

    const startedAt = new Date();
    appendJsonl(generationLogPath, {
      event: 'generation-started',
      articleKey,
      cafeSlug: firstRow.cafeSlug,
      cafeId: firstRow.cafeId,
      articleId: firstRow.articleId,
      readerAccountIds: readerAccounts.map((account) => account.id),
      exactCount: rows.length,
      at: startedAt.toISOString(),
    });

    try {
      let selectedReaderAccount: NaverAccount | null = null;
      let article: Awaited<ReturnType<typeof readCafeArticleContent>> | null = null;
      const readerErrors: string[] = [];
      const dbArticle = await PublishedArticle.findOne(
        { cafeId: firstRow.cafeId, articleId: firstRow.articleId },
        { title: 1, content: 1, articleUrl: 1 },
      ).lean<{ title?: string; content?: string; articleUrl?: string } | null>();

      if (dbArticle?.content && normalizeCommentContent(dbArticle.content).length >= 120) {
        selectedReaderAccount = readerAccounts[0];
        article = {
          success: true,
          title: dbArticle.title || firstRow.subject,
          content: dbArticle.content,
          url: dbArticle.articleUrl || firstRow.articleUrl,
        };
        appendJsonl(generationLogPath, {
          event: 'generation-reader-succeeded',
          articleKey,
          cafeSlug: firstRow.cafeSlug,
          cafeId: firstRow.cafeId,
          articleId: firstRow.articleId,
          readerAccountId: 'db',
          readerAttempt: 0,
          at: new Date().toISOString(),
        });
      }

      for (const [readerIndex, readerAccount] of readerAccounts.entries()) {
        if (article?.success && article.content && selectedReaderAccount) break;
        appendJsonl(generationLogPath, {
          event: 'generation-reader-started',
          articleKey,
          cafeSlug: firstRow.cafeSlug,
          cafeId: firstRow.cafeId,
          articleId: firstRow.articleId,
          readerAccountId: readerAccount.id,
          readerAttempt: readerIndex + 1,
          readerAttemptTotal: readerAccounts.length,
          at: new Date().toISOString(),
        });

        const candidate = await readCafeArticleContent(readerAccount, firstRow.cafeId, firstRow.articleId, {
          loginWaitMs: options.loginWaitMin * 60_000,
          reason: `work_cafe_comment_read:${readerAccount.id}`,
        });

        if (candidate.success && candidate.content) {
          article = candidate;
          selectedReaderAccount = readerAccount;
          appendJsonl(generationLogPath, {
            event: 'generation-reader-succeeded',
            articleKey,
            cafeSlug: firstRow.cafeSlug,
            cafeId: firstRow.cafeId,
            articleId: firstRow.articleId,
            readerAccountId: readerAccount.id,
            readerAttempt: readerIndex + 1,
            at: new Date().toISOString(),
          });
          break;
        }

        const readerError = candidate.error || '본문 읽기 실패';
        readerErrors.push(`${readerAccount.id}: ${readerError}`);
        appendJsonl(generationLogPath, {
          event: 'generation-reader-failed',
          articleKey,
          cafeSlug: firstRow.cafeSlug,
          cafeId: firstRow.cafeId,
          articleId: firstRow.articleId,
          readerAccountId: readerAccount.id,
          readerAttempt: readerIndex + 1,
          error: readerError,
          at: new Date().toISOString(),
        });
      }

      if (!article?.content || !selectedReaderAccount) {
        throw new Error(readerErrors.join(' | ') || '본문 읽기 실패');
      }

      if (!article.success || !article.content) {
        throw new Error(article.error || '본문 읽기 실패');
      }

      let result: Awaited<ReturnType<typeof generateCafeCommentBatch>> | null = null;
      let lastGenerateError = '';

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const candidate = await generateCafeCommentBatch({
            keyword: firstRow.subject,
            exactCount: rows.length,
            model: options.model,
          });
          const hasCriticalWarning = candidate.warnings.some((warning) =>
            warning.startsWith('count-out-of-range') ||
            warning.startsWith('duplicate-start') ||
            warning.startsWith('repeated-opening') ||
            warning.startsWith('contains-wongo'),
          );
          result = candidate;

          if (candidate.comments.length >= rows.length && !hasCriticalWarning) break;
          lastGenerateError = `댓글 생성 검증 경고: ${candidate.warnings.join(', ') || 'none'}`;
        } catch (error) {
          lastGenerateError = error instanceof Error ? error.message : '댓글 생성 실패';
        }
      }

      if (!result || result.comments.length < rows.length) {
        throw new Error(lastGenerateError || `댓글 생성 개수 부족: ${result?.comments.length || 0}/${rows.length}`);
      }

      const generated: GeneratedArticle = {
        articleKey,
        cafeId: firstRow.cafeId,
        articleId: firstRow.articleId,
        title: article.title || firstRow.subject,
        bodyLength: article.content.length,
        comments: result.comments.slice(0, rows.length).map((comment) => ({
          index: comment.index,
          // 최종 방어: 재생성 후에도 남은 "원고" 표현을 자연스러운 지칭으로 치환해 게시
          content: comment.content.replace(/원고에서/g, '글에서').replace(/원고에/g, '글에').replace(/원고/g, '글'),
          persona: comment.persona,
          intent: comment.intent,
        })),
        warnings: result.warnings,
        readerAccountId: selectedReaderAccount.id,
        generatedAt: new Date().toISOString(),
      };

      state.generatedArticles += 1;
      appendJsonl(generationLogPath, {
        event: 'generation-succeeded',
        articleKey,
        cafeSlug: firstRow.cafeSlug,
        cafeId: firstRow.cafeId,
        articleId: firstRow.articleId,
        readerAccountId: selectedReaderAccount.id,
        commentCount: generated.comments.length,
        warnings: generated.warnings,
        elapsedMs: Date.now() - startedAt.getTime(),
        at: generated.generatedAt,
      });

      return generated;
    } catch (error) {
      state.generationFailed += 1;
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      appendJsonl(generationLogPath, {
        event: 'generation-failed',
        articleKey,
        cafeSlug: firstRow.cafeSlug,
        cafeId: firstRow.cafeId,
        articleId: firstRow.articleId,
        readerAccountIds: readerAccounts.map((account) => account.id),
        error: errorMessage,
        at: new Date().toISOString(),
      });
      throw error;
    }
  };

  const getGeneratedArticle = (articleKey: string): Promise<GeneratedArticle> => {
    const existing = promises.get(articleKey);
    if (existing) return existing;

    const promise = limiter.run(() => generateArticle(articleKey));
    promises.set(articleKey, promise);
    return promise;
  };

  return {
    startAll: () => {
      for (const articleKey of articleGroups.keys()) {
        void getGeneratedArticle(articleKey).catch(() => undefined);
      }
    },
    getGeneratedArticle,
  };
};

const updateWorkArticleAfterSuccess = async (
  cafeId: string,
  articleId: number,
  targetCommentCount: number,
): Promise<void> => {
  const article = await WorkCafeArticle.findOneAndUpdate(
    { cafeId, articleId },
    {
      $inc: { commentCount: 1 },
      $set: { commentWorkStatus: 'queued' },
    },
    { new: true },
  ).lean<{ commentCount?: number; targetCommentCount?: number } | null>();

  const effectiveTarget = Number(article?.targetCommentCount || targetCommentCount || 8);
  if (Number(article?.commentCount || 0) >= effectiveTarget) {
    await WorkCafeArticle.updateOne(
      { cafeId, articleId },
      { $set: { commentWorkStatus: 'done', needsCommentWork: false } },
    );
  }
};

const runTask = async (params: {
  task: RuntimeTask;
  accounts: Map<string, NaverAccount>;
  getGeneratedArticle: (articleKey: string) => Promise<GeneratedArticle>;
  state: RunnerState;
  runLogPath: string;
  screenshotDir: string;
  summaryPath: string;
  options: RunnerArgs;
  runtimePlan: RuntimeTask[];
  runtimeBlockedPairs: Set<string>;
}): Promise<TaskOutcome> => {
  const {
    task,
    accounts,
    getGeneratedArticle,
    state,
    runLogPath,
    screenshotDir,
    summaryPath,
    options,
    runtimePlan,
    runtimeBlockedPairs,
  } = params;
  const { row } = task;
  const account = accounts.get(row.accountId);

  state.launched += 1;

  if (!account) {
    state.skipped += 1;
    appendJsonl(runLogPath, {
      event: 'comment-skipped',
      reason: 'account-not-found',
      sequence: row.sequence,
      accountId: row.accountId,
      cafeId: row.cafeId,
      articleId: row.articleId,
      at: new Date().toISOString(),
    });
    return 'skipped';
  }

  try {
    const pairKeys = getPairKeys(row);
    if (pairKeys.some((pairKey) => runtimeBlockedPairs.has(pairKey))) {
      state.skipped += 1;
      appendJsonl(runLogPath, {
        event: 'comment-skipped',
        reason: 'runtime-pair-blocked',
        sequence: row.sequence,
        cafeSlug: row.cafeSlug,
        cafeId: row.cafeId,
        articleId: row.articleId,
        accountId: row.accountId,
        pairKeys,
        at: new Date().toISOString(),
      });
      return 'skipped';
    }

    const alreadyCommented = await hasCommented(row.cafeId, row.articleId, row.accountId, 'comment');
    if (alreadyCommented) {
      state.skipped += 1;
      appendJsonl(runLogPath, {
        event: 'comment-skipped',
        reason: 'already-commented',
        sequence: row.sequence,
        cafeId: row.cafeId,
        articleId: row.articleId,
        accountId: row.accountId,
        at: new Date().toISOString(),
      });
      return 'skipped';
    }

    const currentWorkArticle = await WorkCafeArticle.findOne(
      { cafeId: row.cafeId, articleId: row.articleId },
      { commentCount: 1, targetCommentCount: 1 },
    ).lean<{ commentCount?: number; targetCommentCount?: number } | null>();
    const currentCommentCount = Number(currentWorkArticle?.commentCount ?? row.currentCommentCount ?? 0);
    const effectiveTargetCommentCount = Number(
      currentWorkArticle?.targetCommentCount ?? row.targetCommentCount ?? 8,
    );

    if (currentCommentCount >= effectiveTargetCommentCount) {
      state.skipped += 1;
      appendJsonl(runLogPath, {
        event: 'comment-skipped',
        reason: 'target-comment-count-reached',
        sequence: row.sequence,
        cafeId: row.cafeId,
        articleId: row.articleId,
        accountId: row.accountId,
        currentCommentCount,
        effectiveTargetCommentCount,
        at: new Date().toISOString(),
      });
      return 'skipped';
    }

    const generated = await getGeneratedArticle(task.articleKey);
    const existingCommentContents = new Set(
      (await getArticleComments(row.cafeId, row.articleId)).map((comment) =>
        normalizeCommentContent(comment.content),
      ),
    );
    const preferredComment = generated.comments[task.articleCommentIndex];
    const comment =
      preferredComment && !existingCommentContents.has(normalizeCommentContent(preferredComment.content))
        ? preferredComment
        : generated.comments.find((candidate) => !existingCommentContents.has(normalizeCommentContent(candidate.content)));

    if (!comment?.content) {
      throw new Error(`중복되지 않는 생성 댓글 후보 없음: index=${task.articleCommentIndex}`);
    }

    appendJsonl(runLogPath, {
      event: 'comment-started',
      sequence: row.sequence,
      dueAtKst: task.dueAtKst,
      cafeSlug: row.cafeSlug,
      cafeId: row.cafeId,
      articleId: row.articleId,
      accountId: row.accountId,
      commentSlot: row.commentSlot,
      at: new Date().toISOString(),
    });

    if (options.dryRun) {
      state.skipped += 1;
      appendJsonl(runLogPath, {
        event: 'comment-dry-run',
        sequence: row.sequence,
        cafeId: row.cafeId,
        articleId: row.articleId,
        accountId: row.accountId,
        content: comment.content,
        at: new Date().toISOString(),
      });
      return 'skipped';
    }

    const result = await writeCommentWithAccount(
      account,
      row.cafeId,
      row.articleId,
      comment.content,
      {
        forceFreshLogin: false,
        loginWaitMs: options.loginWaitMin * 60_000,
      },
    );

    if (!result.success) {
      throw new Error(result.error || '댓글 작성 실패');
    }

    await addCommentToArticle(row.cafeId, row.articleId, {
      accountId: row.accountId,
      nickname: account.nickname || row.accountNickname || row.accountId,
      content: comment.content,
      type: 'comment',
      commentId: result.commentId,
      commentIndex: row.commentSlot,
      sequenceId: state.runId,
    });
    await updateWorkArticleAfterSuccess(row.cafeId, row.articleId, row.targetCommentCount);

    state.success += 1;
    appendJsonl(runLogPath, {
      event: 'comment-succeeded',
      sequence: row.sequence,
      cafeSlug: row.cafeSlug,
      cafeId: row.cafeId,
      articleId: row.articleId,
      accountId: row.accountId,
      commentId: result.commentId,
      success: state.success,
      at: new Date().toISOString(),
    });

    if (state.success === 1 || (options.screenshotEvery > 0 && state.success % options.screenshotEvery === 0)) {
      const screenshot = await captureCommentUi({
        accountId: row.accountId,
        cafeId: row.cafeId,
        articleId: row.articleId,
        outputDir: screenshotDir,
        sequence: row.sequence,
      });
      state.screenshots.push(screenshot);
      appendJsonl(runLogPath, {
        event: 'ui-captured',
        sequence: row.sequence,
        screenshot,
        at: new Date().toISOString(),
      });
    }
    return 'success';
  } catch (error) {
    state.failed += 1;
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    const pairKeys = getPairKeys(row);
    appendJsonl(runLogPath, {
      event: 'comment-failed',
      sequence: row.sequence,
      cafeSlug: row.cafeSlug,
      cafeId: row.cafeId,
      articleId: row.articleId,
      accountId: row.accountId,
      error: errorMessage,
      failed: state.failed,
      at: new Date().toISOString(),
    });
    if (isRuntimePairBlockError(errorMessage)) {
      for (const pairKey of pairKeys) runtimeBlockedPairs.add(pairKey);
      appendJsonl(runLogPath, {
        event: 'runtime-pair-blocked',
        sequence: row.sequence,
        cafeSlug: row.cafeSlug,
        cafeId: row.cafeId,
        articleId: row.articleId,
        accountId: row.accountId,
        pairKeys,
        error: errorMessage,
        at: new Date().toISOString(),
      });
    }
    console.error(
      `[WORK-CAFE-COMMENT] 실패 seq=${row.sequence} ${row.accountId} ${row.cafeSlug}/${row.articleId}: ${errorMessage}`,
    );
    return 'failed';
  } finally {
    writeSummary(summaryPath, state, options, runtimePlan);
  }
};

const runScheduler = async (params: {
  runtimePlan: RuntimeTask[];
  accounts: Map<string, NaverAccount>;
  getGeneratedArticle: (articleKey: string) => Promise<GeneratedArticle>;
  state: RunnerState;
  runLogPath: string;
  screenshotDir: string;
  summaryPath: string;
  options: RunnerArgs;
  runtimeBlockedPairs: Set<string>;
}): Promise<void> => {
  const {
    runtimePlan,
    accounts,
    getGeneratedArticle,
    state,
    runLogPath,
    screenshotDir,
    summaryPath,
    options,
    runtimeBlockedPairs,
  } = params;
  const active = new Set<Promise<TaskOutcome>>();

  for (const task of runtimePlan) {
    await sleep(task.dueAtMs - Date.now());

    while (active.size >= options.maxActive) {
      await Promise.race(active);
    }

    const promise = runTask({
      task,
      accounts,
      getGeneratedArticle,
      state,
      runLogPath,
      screenshotDir,
      summaryPath,
      options,
      runtimePlan,
      runtimeBlockedPairs,
    }).finally(() => {
      active.delete(promise);
    });
    active.add(promise);
  }

  await Promise.all(active);
};

const groupRuntimePlanByAccount = (runtimePlan: RuntimeTask[]): Map<string, RuntimeTask[]> => {
  const grouped = new Map<string, RuntimeTask[]>();

  for (const task of runtimePlan) {
    const accountTasks = grouped.get(task.row.accountId) ?? [];
    accountTasks.push(task);
    grouped.set(task.row.accountId, accountTasks);
  }

  for (const tasks of grouped.values()) {
    tasks.sort((a, b) => a.dueAtMs - b.dueAtMs || a.row.sequence - b.row.sequence);
  }

  return grouped;
};

const runAccountWorkerScheduler = async (params: {
  runtimePlan: RuntimeTask[];
  accounts: Map<string, NaverAccount>;
  getGeneratedArticle: (articleKey: string) => Promise<GeneratedArticle>;
  state: RunnerState;
  runLogPath: string;
  screenshotDir: string;
  summaryPath: string;
  options: RunnerArgs;
  runtimeBlockedPairs: Set<string>;
}): Promise<void> => {
  const {
    runtimePlan,
    accounts,
    getGeneratedArticle,
    state,
    runLogPath,
    screenshotDir,
    summaryPath,
    options,
    runtimeBlockedPairs,
  } = params;
  const limiter = new Semaphore(Math.max(1, options.maxActive));
  const grouped = groupRuntimePlanByAccount(runtimePlan);

  await Promise.all(
    Array.from(grouped.entries()).map(([accountId, tasks]) =>
      limiter.run(async () => {
        appendJsonl(runLogPath, {
          event: 'account-worker-started',
          accountId,
          taskCount: tasks.length,
          firstDueAtKst: tasks[0]?.dueAtKst,
          lastDueAtKst: tasks.at(-1)?.dueAtKst,
          at: new Date().toISOString(),
        });

        for (const task of tasks) {
          await sleep(task.dueAtMs - Date.now());
          await runTask({
            task,
            accounts,
            getGeneratedArticle,
            state,
            runLogPath,
            screenshotDir,
            summaryPath,
            options,
            runtimePlan,
            runtimeBlockedPairs,
          });
        }

        appendJsonl(runLogPath, {
          event: 'account-worker-ended',
          accountId,
          taskCount: tasks.length,
          at: new Date().toISOString(),
        });
      }),
    ),
  );
};

const groupRuntimePlanByArticle = (runtimePlan: RuntimeTask[]): Map<string, RuntimeTask[]> => {
  const grouped = new Map<string, RuntimeTask[]>();

  for (const task of runtimePlan) {
    const articleTasks = grouped.get(task.articleKey) ?? [];
    articleTasks.push(task);
    grouped.set(task.articleKey, articleTasks);
  }

  for (const tasks of grouped.values()) {
    tasks.sort((a, b) => a.row.sequence - b.row.sequence);
  }

  return new Map(
    Array.from(grouped.entries()).sort(([, leftTasks], [, rightTasks]) =>
      leftTasks[0].row.sequence - rightTasks[0].row.sequence,
    ),
  );
};

const runArticleBatchScheduler = async (params: {
  runtimePlan: RuntimeTask[];
  accounts: Map<string, NaverAccount>;
  getGeneratedArticle: (articleKey: string) => Promise<GeneratedArticle>;
  state: RunnerState;
  runLogPath: string;
  screenshotDir: string;
  summaryPath: string;
  options: RunnerArgs;
  runtimeBlockedPairs: Set<string>;
}): Promise<void> => {
  const {
    runtimePlan,
    accounts,
    getGeneratedArticle,
    state,
    runLogPath,
    screenshotDir,
    summaryPath,
    options,
    runtimeBlockedPairs,
  } = params;
  const grouped = groupRuntimePlanByArticle(runtimePlan);
  const accountNextAt = new Map<string, number>();

  for (const [articleKey, tasks] of grouped.entries()) {
    appendJsonl(runLogPath, {
      event: 'article-batch-started',
      articleKey,
      cafeSlug: tasks[0]?.row.cafeSlug,
      cafeId: tasks[0]?.row.cafeId,
      articleId: tasks[0]?.row.articleId,
      taskCount: tasks.length,
      at: new Date().toISOString(),
    });

    await getGeneratedArticle(articleKey);

    const active = new Set<Promise<TaskOutcome>>();
    for (const task of tasks) {
      while (active.size >= options.maxActive) {
        await Promise.race(active);
      }

      const promise = (async (): Promise<TaskOutcome> => {
        await sleep((accountNextAt.get(task.row.accountId) ?? 0) - Date.now());
        const outcome = await runTask({
          task,
          accounts,
          getGeneratedArticle,
          state,
          runLogPath,
          screenshotDir,
          summaryPath,
          options,
          runtimePlan,
          runtimeBlockedPairs,
        });
        accountNextAt.set(task.row.accountId, Date.now() + options.accountGapMin * 60_000);
        return outcome;
      })().finally(() => {
        active.delete(promise);
      });
      active.add(promise);
    }

    await Promise.all(active);
    appendJsonl(runLogPath, {
      event: 'article-batch-ended',
      articleKey,
      cafeSlug: tasks[0]?.row.cafeSlug,
      cafeId: tasks[0]?.row.cafeId,
      articleId: tasks[0]?.row.articleId,
      taskCount: tasks.length,
      at: new Date().toISOString(),
    });
  }
};

const runCanary = async (params: {
  runtimePlan: RuntimeTask[];
  accounts: Map<string, NaverAccount>;
  getGeneratedArticle: (articleKey: string) => Promise<GeneratedArticle>;
  state: RunnerState;
  runLogPath: string;
  screenshotDir: string;
  summaryPath: string;
  options: RunnerArgs;
  runtimeBlockedPairs: Set<string>;
}): Promise<Set<number>> => {
  const {
    runtimePlan,
    accounts,
    getGeneratedArticle,
    state,
    runLogPath,
    screenshotDir,
    summaryPath,
    options,
    runtimeBlockedPairs,
  } = params;
  const targetSuccess = Math.max(0, options.canarySuccessTarget);
  const attemptedSequences = new Set<number>();

  if (targetSuccess === 0 || runtimePlan.length === 0) {
    return attemptedSequences;
  }

  const maxAttempts = Math.min(
    runtimePlan.length,
    Math.max(targetSuccess, options.canaryMaxAttempts || targetSuccess * 4),
  );
  const maxActive = Math.max(1, Math.min(options.canaryMaxActive || 3, options.maxActive));
  const active = new Set<Promise<void>>();
  let cursor = 0;
  let success = 0;
  let failed = 0;
  let skipped = 0;

  appendJsonl(runLogPath, {
    event: 'canary-started',
    targetSuccess,
    maxAttempts,
    maxActive,
    launchGapSec: options.canaryLaunchGapSec,
    at: new Date().toISOString(),
  });

  const launch = (task: RuntimeTask): void => {
    attemptedSequences.add(task.row.sequence);
    const promise = runTask({
      task,
      accounts,
      getGeneratedArticle,
      state,
      runLogPath,
      screenshotDir,
      summaryPath,
      options,
      runtimePlan,
      runtimeBlockedPairs,
    })
      .then((outcome) => {
        if (outcome === 'success') success += 1;
        if (outcome === 'failed') failed += 1;
        if (outcome === 'skipped') skipped += 1;
      })
      .finally(() => {
        active.delete(promise);
      });
    active.add(promise);
  };

  while (success < targetSuccess && cursor < maxAttempts) {
    while (
      active.size < maxActive &&
      cursor < maxAttempts &&
      success + active.size < targetSuccess
    ) {
      launch(runtimePlan[cursor]);
      cursor += 1;
      if (options.canaryLaunchGapSec > 0) {
        await sleep(options.canaryLaunchGapSec * 1000);
      }
    }

    if (active.size === 0) break;
    await Promise.race(active);
  }

  await Promise.all(active);

  const passed = success >= targetSuccess;
  appendJsonl(runLogPath, {
    event: 'canary-completed',
    passed,
    targetSuccess,
    success,
    failed,
    skipped,
    attempted: attemptedSequences.size,
    attemptedSequences: Array.from(attemptedSequences),
    runtimeBlockedPairs: Array.from(runtimeBlockedPairs),
    at: new Date().toISOString(),
  });

  if (!passed) {
    throw new Error(
      `CANARY_FAILED: 실제 댓글 ${targetSuccess}개 성공 전 검증 실패 ` +
        `(success=${success}, failed=${failed}, skipped=${skipped}, attempted=${attemptedSequences.size})`,
    );
  }

  return attemptedSequences;
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  const options = getArgs();
  const schedulePayload = loadSchedule(options.schedulePath, options);
  verifyOwnerExclusion(schedulePayload.schedule);
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = join(process.cwd(), 'outputs', `work-cafe-comment-live-${runId}`);
  const screenshotDir = join(outputDir, 'screenshots');
  mkdirSync(screenshotDir, { recursive: true });

  const runLogPath = join(outputDir, `run-${runId}.jsonl`);
  const generationLogPath = join(outputDir, `generation-${runId}.jsonl`);
  const summaryPath = join(outputDir, `summary-${runId}.md`);
  const planPath = join(outputDir, `runtime-plan-${runId}.json`);

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  const runnable = await filterRunnableSchedule(schedulePayload.schedule);
  const initiallyFilteredSchedule = runnable.schedule;
  const requiredAccountIds = new Set(initiallyFilteredSchedule.map((row) => row.accountId));
  const accounts = await loadAccounts(options.loginId, requiredAccountIds);
  const warmupResult = options.skipWarmup
    ? { warmedAccountIds: [], failedAccounts: [] }
    : await warmupScheduleSessions(Array.from(accounts.values()), {
        continueOnFailure: true,
        loginWaitMs: options.loginWaitMin * 60_000,
        reason: `work_cafe_comment_${runId}`,
        reservationTtlMs: 2 * 60 * 60 * 1000,
        waitBetweenAccountsMs: 1000,
      });
  const warmupFailedAccountIds = new Set((warmupResult.failedAccounts || []).map((failure) => failure.accountId));
  const filteredSchedule = initiallyFilteredSchedule.filter((row) => !warmupFailedAccountIds.has(row.accountId));
  const canaryArticleGroups = groupRowsByArticle(filteredSchedule);
  const canaryRuntimePlan = buildRuntimePlan(filteredSchedule, canaryArticleGroups, options);
  const state: RunnerState = {
    runId,
    totalTasks: canaryRuntimePlan.length,
    launched: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    generatedArticles: 0,
    generationFailed: 0,
    screenshots: [],
    startedAt: new Date().toISOString(),
  };
  const runtimeBlockedPairs = new Set<string>();

  appendJsonl(runLogPath, {
    event: 'run-started',
    runId,
    schedulePath: options.schedulePath,
    originalTasks: schedulePayload.schedule.length,
    skippedAlreadyCommented: runnable.skippedAlreadyCommented,
    warmupWarmedAccountIds: warmupResult.warmedAccountIds,
    warmupFailedAccounts: warmupResult.failedAccounts || [],
    canarySuccessTarget: options.canarySuccessTarget,
    at: state.startedAt,
  });

  const canaryGenerator = createArticleGenerator({
    articleGroups: canaryArticleGroups,
    accounts,
    options,
    generationLogPath,
    state,
  });
  const canaryAttemptedSequences = await runCanary({
    runtimePlan: canaryRuntimePlan,
    accounts,
    getGeneratedArticle: canaryGenerator.getGeneratedArticle,
    state,
    runLogPath,
    screenshotDir,
    summaryPath,
    options,
    runtimeBlockedPairs,
  });

  const mainSchedule = filteredSchedule.filter((row) => !canaryAttemptedSequences.has(row.sequence));
  const articleGroups = groupRowsByArticle(mainSchedule);
  const runtimePlan = buildRuntimePlan(mainSchedule, articleGroups, options);
  state.totalTasks = canaryAttemptedSequences.size + runtimePlan.length;

  writeFileSync(
    planPath,
    JSON.stringify(
      {
        runId,
        scheduleGeneratedAt: schedulePayload.generatedAt,
        scheduleCollectionId: schedulePayload.collectionId,
        options,
        filtered: {
          originalTasks: schedulePayload.schedule.length,
          skippedAlreadyCommented: runnable.skippedAlreadyCommented,
          warmupFailedAccountIds: Array.from(warmupFailedAccountIds),
          canaryAttemptedSequences: Array.from(canaryAttemptedSequences),
          runnableTasks: mainSchedule.length,
        },
        totals: {
          tasks: state.totalTasks,
          mainTasks: runtimePlan.length,
          articles: articleGroups.size,
          accounts: accounts.size,
        },
        firstDueAtKst: runtimePlan[0]?.dueAtKst,
        lastDueAtKst: runtimePlan.at(-1)?.dueAtKst,
        runtimePlan,
      },
      null,
      2,
    ),
    'utf-8',
  );

  appendJsonl(runLogPath, {
    event: 'main-schedule-started',
    runId,
    totalTasks: state.totalTasks,
    mainTasks: runtimePlan.length,
    articleCount: articleGroups.size,
    accountCount: accounts.size,
    firstDueAtKst: runtimePlan[0]?.dueAtKst,
    lastDueAtKst: runtimePlan.at(-1)?.dueAtKst,
    at: new Date().toISOString(),
  });
  writeSummary(summaryPath, state, options, runtimePlan);

  console.log('[WORK-CAFE-COMMENT] 실행 시작');
  console.log(`runId: ${runId}`);
  console.log(`tasks: ${runtimePlan.length}`);
  console.log(`articles: ${articleGroups.size}`);
  console.log(`accounts: ${accounts.size}`);
  console.log(
    `schedulerMode: ${options.articleBatches ? 'article-batches' : options.accountWorkers ? 'account-workers' : 'global'}`,
  );
  console.log(`firstDueAtKst: ${runtimePlan[0]?.dueAtKst}`);
  console.log(`lastDueAtKst: ${runtimePlan.at(-1)?.dueAtKst}`);
  console.log(`outputDir: ${outputDir}`);

  const generator = createArticleGenerator({
    articleGroups,
    accounts,
    options,
    generationLogPath,
    state,
  });

  const prefetchKeys = Array.from(articleGroups.keys()).slice(0, Math.max(0, options.prefetchArticles));
  await Promise.all(prefetchKeys.map((articleKey) => generator.getGeneratedArticle(articleKey).catch(() => undefined)));
  const backgroundPrefetchKeys = Array.from(articleGroups.keys())
    .filter((articleKey) => !prefetchKeys.includes(articleKey))
    .slice(0, Math.max(0, options.backgroundPrefetchArticles));
  for (const articleKey of backgroundPrefetchKeys) {
    void generator.getGeneratedArticle(articleKey).catch(() => undefined);
  }
  writeSummary(summaryPath, state, options, runtimePlan);

  const progressTimer = setInterval(() => {
    const message = [
      `[WORK-CAFE-COMMENT] progress`,
      `success=${state.success}/${state.totalTasks}`,
      `failed=${state.failed}`,
      `generatedArticles=${state.generatedArticles}/${articleGroups.size}`,
      `screenshots=${state.screenshots.length}`,
    ].join(' ');
    console.log(message);
    writeSummary(summaryPath, state, options, runtimePlan);
  }, 30_000);

  try {
    const scheduler = options.articleBatches
      ? runArticleBatchScheduler
      : options.accountWorkers
        ? runAccountWorkerScheduler
        : runScheduler;
    await scheduler({
      runtimePlan,
      accounts,
      getGeneratedArticle: generator.getGeneratedArticle,
      state,
      runLogPath,
      screenshotDir,
      summaryPath,
      options,
      runtimeBlockedPairs,
    });
  } finally {
    clearInterval(progressTimer);
    state.endedAt = new Date().toISOString();
    writeSummary(summaryPath, state, options, runtimePlan);
    appendJsonl(runLogPath, {
      event: 'run-ended',
      runId,
      success: state.success,
      failed: state.failed,
      skipped: state.skipped,
      generatedArticles: state.generatedArticles,
      generationFailed: state.generationFailed,
      screenshots: state.screenshots,
      at: state.endedAt,
    });
    console.log('[WORK-CAFE-COMMENT] 실행 종료');
    console.log(`success: ${state.success}`);
    console.log(`failed: ${state.failed}`);
    console.log(`skipped: ${state.skipped}`);
    console.log(`summary: ${summaryPath}`);
    await closeAllContexts();
    await mongoose.disconnect();
  }
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('[WORK-CAFE-COMMENT] runner failed:', errorMessage);
    try {
      await closeAllContexts();
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
