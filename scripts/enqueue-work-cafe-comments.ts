import { mkdirSync, readFileSync, statSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { PublishedArticle } from '../src/shared/models/published-article';
import { WorkCafeArticle } from '../src/shared/models/work-cafe-article';
import { getAllAccounts } from '../src/shared/config/accounts';
import { addTaskJob, closeAllQueues, createRescheduleToken, getTaskQueue } from '../src/shared/lib/queue';
import type { CommentJobData, TaskJobData } from '../src/shared/lib/queue/types';
import type { NaverAccount } from '../src/shared/lib/account-manager';
import { readCafeArticleContent } from '../src/shared/lib/cafe-article-reader';
import { closeAllContexts } from '../src/shared/lib/multi-session';
import { generateCafeCommentBatch } from '../src/shared/api/cafe-comment-batch-api';

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
  accountId: string;
  accountNickname: string;
}

interface SchedulePayload {
  generatedAt: string;
  collectionId: string;
  schedule: ScheduleRow[];
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

const hasFlag = (flag: string): boolean => args.includes(flag);

const getTimestamp = (): string => new Date().toISOString().replace(/[:.]/g, '-');

const toKstDateTime = (date: Date): string =>
  new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 19).replace('T', ' ');

const findLatestSchedulePath = (): string => {
  const outputDir = join(process.cwd(), 'outputs');
  const candidates = readdirSync(outputDir)
    .filter((name) => /^work-cafe-comment-schedule-.*\.json$/.test(name))
    .map((name) => {
      const path = join(outputDir, name);
      return { path, mtimeMs: statSync(path).mtimeMs };
    });

  if (candidates.length === 0) throw new Error('work cafe comment schedule artifact not found');
  return candidates.sort((a, b) => b.mtimeMs - a.mtimeMs)[0].path;
};

const getArticleKey = (row: Pick<ScheduleRow, 'cafeId' | 'articleId'>): string =>
  `${row.cafeId}:${row.articleId}`;

const getCommentKey = (row: Pick<ScheduleRow, 'cafeId' | 'articleId' | 'accountId'>): string =>
  `${row.cafeId}:${row.articleId}:${row.accountId}`;

const normalizeCommentContent = (value: string): string => value.replace(/\s+/g, ' ').trim();

const groupRowsByArticle = (rows: ScheduleRow[]): Map<string, ScheduleRow[]> => {
  const grouped = new Map<string, ScheduleRow[]>();

  for (const row of rows) {
    const key = getArticleKey(row);
    const articleRows = grouped.get(key) ?? [];
    articleRows.push(row);
    grouped.set(key, articleRows);
  }

  for (const articleRows of grouped.values()) {
    articleRows.sort((a, b) => a.sequence - b.sequence);
  }

  return grouped;
};

const loadRunnableSchedule = async (
  schedulePath: string,
  options: {
    excludeAccountIds: Set<string>;
    skipArticleKeys: Set<string>;
    onlyArticleKeys: Set<string>;
    pendingCommentKeys: Set<string>;
  },
): Promise<ScheduleRow[]> => {
  const payload = JSON.parse(readFileSync(resolve(schedulePath), 'utf-8')) as SchedulePayload;
  const filtered = payload.schedule.filter((row) => {
    const articleKey = getArticleKey(row);
    if (options.excludeAccountIds.has(row.accountId)) return false;
    if (options.skipArticleKeys.has(articleKey)) return false;
    if (options.onlyArticleKeys.size > 0 && !options.onlyArticleKeys.has(articleKey)) return false;
    if (options.pendingCommentKeys.has(getCommentKey(row))) return false;
    return true;
  });

  const grouped = groupRowsByArticle(filtered);
  const runnable: ScheduleRow[] = [];

  for (const [articleKey, rows] of grouped.entries()) {
    const [cafeId, articleIdText] = articleKey.split(':');
    const articleId = Number(articleIdText);
    const article = await PublishedArticle.findOne({ cafeId, articleId }, { comments: 1 }).lean<{
      comments?: Array<{ accountId: string; type: string; content: string }>;
    } | null>();
    const commentedAccountIds = new Set(
      (article?.comments || [])
        .filter((comment) => comment.type === 'comment')
        .map((comment) => comment.accountId),
    );

    runnable.push(...rows.filter((row) => !commentedAccountIds.has(row.accountId)));
  }

  return runnable.sort((a, b) => a.sequence - b.sequence);
};

const loadPendingCommentKeys = async (): Promise<Set<string>> => {
  const queue = getTaskQueue('work-cafe-comment-dedupe');
  const jobs = await queue.getJobs(['waiting', 'delayed', 'active'], 0, 20_000, true);
  const keys = new Set<string>();

  for (const job of jobs) {
    const data = job.data as TaskJobData;
    if (data.type !== 'comment') continue;
    keys.add(`${data.cafeId}:${data.articleId}:${data.accountId}`);
  }

  return keys;
};

const countPendingArticleComments = (pendingCommentKeys: Set<string>, articleKey: string): number => {
  const prefix = `${articleKey}:`;
  let count = 0;
  for (const key of pendingCommentKeys) {
    if (key.startsWith(prefix)) count += 1;
  }
  return count;
};

const readArticle = async (
  rows: ScheduleRow[],
  accounts: Map<string, NaverAccount>,
  loginWaitMs: number,
): Promise<{ title: string; content: string; url: string; readerAccountId: string }> => {
  const firstRow = rows[0];
  const dbArticle = await PublishedArticle.findOne(
    { cafeId: firstRow.cafeId, articleId: firstRow.articleId },
    { title: 1, content: 1, articleUrl: 1 },
  ).lean<{ title?: string; content?: string; articleUrl?: string } | null>();

  if (dbArticle?.content && normalizeCommentContent(dbArticle.content).length >= 120) {
    return {
      title: dbArticle.title || firstRow.subject,
      content: dbArticle.content,
      url: dbArticle.articleUrl || firstRow.articleUrl,
      readerAccountId: 'db',
    };
  }

  const readerAccounts = rows
    .map((row) => accounts.get(row.accountId))
    .filter((account): account is NaverAccount => Boolean(account));
  const errors: string[] = [];

  for (const account of readerAccounts) {
    const result = await readCafeArticleContent(account, firstRow.cafeId, firstRow.articleId, {
      loginWaitMs,
      reason: `enqueue_work_cafe_read:${account.id}`,
    });
    if (result.success && result.content) {
      return {
        title: result.title || firstRow.subject,
        content: result.content,
        url: result.url,
        readerAccountId: account.id,
      };
    }
    errors.push(`${account.id}:${result.error || 'read failed'}`);
  }

  throw new Error(errors.join(' | ') || 'article read failed');
};

const writeArtifact = (payload: unknown): string => {
  const outputDir = join(process.cwd(), 'outputs');
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, `work-cafe-comment-enqueue-${getTimestamp()}.json`);
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  return outputPath;
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  const schedulePath = getArgValue('--schedule', findLatestSchedulePath());
  const loginId = getArgValue('--login-id', '21lab');
  const model = getArgValue('--model', 'deepseek-v4-flash');
  const targetCount = Number(getArgValue('--target-count', '8'));
  const articleLimit = Number(getArgValue('--article-limit', '0'));
  const delayStepMs = Number(getArgValue('--delay-step-ms', '15000'));
  const articleDelayMs = Number(getArgValue('--article-delay-ms', '0'));
  const startDelayMs = Number(getArgValue('--start-delay-ms', '0'));
  const loginWaitMs = Number(getArgValue('--login-wait-ms', '0'));
  const dryRun = hasFlag('--dry-run');
  const useSequence = hasFlag('--sequence');
  const excludeAccountIds = new Set(getArgValues('--exclude-account-id'));
  const skipArticleKeys = new Set(getArgValues('--skip-article'));
  const onlyArticleKeys = new Set([...getArgValues('--article'), ...getArgValues('--only-article')]);

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  const user = await User.findOne({ loginId, isActive: true }).lean<{ userId: string } | null>();
  if (!user) throw new Error(`user not found: ${loginId}`);

  const allAccounts = await getAllAccounts(user.userId);
  const accounts = new Map(allAccounts.map((account) => [account.id, account]));
  const pendingCommentKeys = await loadPendingCommentKeys();
  const runnableRows = await loadRunnableSchedule(schedulePath, {
    excludeAccountIds,
    skipArticleKeys,
    onlyArticleKeys,
    pendingCommentKeys,
  });
  const articleGroups = Array.from(groupRowsByArticle(runnableRows).entries());
  const limitedGroups = articleLimit > 0 ? articleGroups.slice(0, articleLimit) : articleGroups;

  const results: Array<Record<string, unknown>> = [];
  let enqueuedJobs = 0;

  for (let articleIndex = 0; articleIndex < limitedGroups.length; articleIndex += 1) {
    const [articleKey, rows] = limitedGroups[articleIndex];
    const firstRow = rows[0];
    const dbCommentState = await PublishedArticle.findOne(
      { cafeId: firstRow.cafeId, articleId: firstRow.articleId },
      { comments: 1 },
    ).lean<{ comments?: Array<{ type: string }> } | null>();
    const workArticle = await WorkCafeArticle.findOne(
      { cafeId: firstRow.cafeId, articleId: firstRow.articleId },
      { commentCount: 1, targetCommentCount: 1, subject: 1 },
    ).lean<{ commentCount?: number; targetCommentCount?: number; subject?: string } | null>();
    const actualCommentCount = (dbCommentState?.comments || []).filter((comment) => comment.type === 'comment').length;
    const fallbackCount = Number(workArticle?.commentCount ?? firstRow.currentCommentCount ?? 0);
    const currentCount = Math.max(actualCommentCount, fallbackCount);
    const pendingCount = countPendingArticleComments(pendingCommentKeys, articleKey);
    const effectiveTarget = Number(workArticle?.targetCommentCount ?? firstRow.targetCommentCount ?? targetCount);
    const shortage = Math.max(0, Math.min(targetCount, effectiveTarget) - currentCount - pendingCount);
    const selectedRows = rows.slice(0, shortage);

    if (selectedRows.length === 0) {
      results.push({ articleKey, status: 'skipped-filled', currentCount, pendingCount, effectiveTarget });
      continue;
    }

    try {
      const article = await readArticle(selectedRows, accounts, loginWaitMs);
      const generated = await generateCafeCommentBatch({
        keyword: firstRow.subject,
        exactCount: selectedRows.length,
        model,
      });
      if (generated.comments.length < selectedRows.length) {
        throw new Error(`generated comment shortage: ${generated.comments.length}/${selectedRows.length}`);
      }

      await PublishedArticle.findOneAndUpdate(
        { cafeId: firstRow.cafeId, articleId: firstRow.articleId },
        {
          $set: {
            cafeId: firstRow.cafeId,
            articleId: firstRow.articleId,
            menuId: '',
            keyword: firstRow.subject,
            title: article.title || firstRow.subject,
            content: article.content,
            articleUrl: article.url || firstRow.articleUrl,
            status: 'published',
          },
          $setOnInsert: {
            writerAccountId: '',
            publishedAt: new Date(),
            commentCount: 0,
            replyCount: 0,
            comments: [],
          },
        },
        { upsert: true },
      );

      const sequenceId = useSequence
        ? `work_cafe_${firstRow.cafeId}_${firstRow.articleId}_${Date.now().toString(36)}`
        : undefined;
      const jobs: Array<Record<string, unknown>> = [];
      for (const [commentIndex, row] of selectedRows.entries()) {
        const comment = generated.comments[commentIndex];
        const jobData: CommentJobData = {
          type: 'comment',
          accountId: row.accountId,
          userId: user.userId,
          cafeId: row.cafeId,
          articleId: row.articleId,
          content: comment.content,
          commentIndex: currentCount + commentIndex,
          keyword: row.subject,
          rescheduleToken: createRescheduleToken(),
        };
        if (useSequence) {
          jobData.sequenceId = sequenceId;
          jobData.sequenceIndex = commentIndex;
        }
        const delayMs = startDelayMs + articleIndex * articleDelayMs + commentIndex * delayStepMs;
        if (!dryRun) await addTaskJob(row.accountId, jobData, delayMs);
        enqueuedJobs += dryRun ? 0 : 1;
        jobs.push({
          accountId: row.accountId,
          commentIndex: jobData.commentIndex,
          sequenceIndex: jobData.sequenceIndex,
          delayMs,
          runAtKst: toKstDateTime(new Date(Date.now() + delayMs)),
          content: comment.content,
        });
      }

      results.push({
        articleKey,
        cafeSlug: firstRow.cafeSlug,
        cafeId: firstRow.cafeId,
        articleId: firstRow.articleId,
        articleUrl: article.url || firstRow.articleUrl,
        title: article.title,
        status: dryRun ? 'dry-run' : 'enqueued',
        currentCount,
        pendingCount,
        effectiveTarget,
        selectedCount: selectedRows.length,
        readerAccountId: article.readerAccountId,
        warnings: generated.warnings,
        jobs,
      });
    } catch (error) {
      results.push({
        articleKey,
        cafeSlug: firstRow.cafeSlug,
        cafeId: firstRow.cafeId,
        articleId: firstRow.articleId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'unknown error',
      });
    }
  }

  const outputPath = writeArtifact({
    generatedAt: new Date().toISOString(),
    dryRun,
    schedulePath,
    loginId,
    options: {
      targetCount,
      articleLimit,
      delayStepMs,
      articleDelayMs,
      startDelayMs,
      useSequence,
      excludeAccountIds: Array.from(excludeAccountIds),
      skipArticleKeys: Array.from(skipArticleKeys),
      onlyArticleKeys: Array.from(onlyArticleKeys),
    },
    totals: {
      articleGroups: articleGroups.length,
      processedArticles: limitedGroups.length,
      enqueuedJobs,
      enqueuedArticles: results.filter((result) => result.status === 'enqueued').length,
      failedArticles: results.filter((result) => result.status === 'failed').length,
    },
    results,
  });

  console.log(`work cafe comment enqueue ${dryRun ? 'dry-run' : 'complete'}`);
  console.log(`articles: ${limitedGroups.length}/${articleGroups.length}`);
  console.log(`enqueuedJobs: ${enqueuedJobs}`);
  console.log(`artifact: ${outputPath}`);
};

main()
  .catch((error) => {
    console.error('enqueue-work-cafe-comments failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closeAllQueues();
    } catch {}
    try {
      await closeAllContexts();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(process.exitCode || 0);
  });
