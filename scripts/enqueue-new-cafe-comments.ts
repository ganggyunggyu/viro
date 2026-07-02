import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { PublishedArticle } from '../src/shared/models/published-article';
import { addTaskJob, closeAllQueues } from '../src/shared/lib/queue';
import { getAllAccounts } from '../src/shared/config/accounts';
import type {
  CommentJobData,
  ReplyJobData,
  ViralCommentItem,
} from '../src/shared/lib/queue/types';
import type { NaverAccount } from '../src/shared/lib/account-manager';

interface SeedRunRow {
  cafeName: string;
  cafeId: string;
  menuId: string;
  ownerAccountId: string;
  title: string;
  body: string;
  keyword: string;
  generatedComments?: ViralCommentItem[];
}

interface SeedRunArtifact {
  rows?: SeedRunRow[];
}

interface PublicArticle {
  articleId: number;
  title: string;
  articleUrl: string;
  publishedAtKst?: string;
  commentCount?: number;
}

interface PublicCafe {
  cafeName: string;
  cafeId: string;
  sheetArticleId?: number;
  articles?: PublicArticle[];
}

interface PublishedArtifact {
  cafes?: PublicCafe[];
}

interface EnqueueTarget {
  row: SeedRunRow;
  article: PublicArticle;
}

interface EnqueueTotals {
  enqueuedJobs: number;
  mainComments: number;
  replies: number;
  skippedJobs: number;
}

const DEFAULT_SOURCE_ARTIFACT = 'outputs/new-cafe-seeding-run-2026-07-02T00-33-19-142Z.json';
const DEFAULT_PUBLISHED_ARTIFACT = 'outputs/new-cafe-published-articles-2026-07-02.json';
const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const FIRST_COMMENT_DELAY = { min: 4 * 60 * 1000, max: 7 * 60 * 1000 };
const BETWEEN_COMMENTS_DELAY = { min: 4 * 60 * 1000, max: 9 * 60 * 1000 };
const BETWEEN_CAFE_OFFSET_MS = 45 * 1000;

const args = process.argv.slice(2);

const hasFlag = (flag: string): boolean => args.includes(flag);

const getArgValue = (name: string, fallback: string): string => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];

  return fallback;
};

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(path, 'utf-8')) as T;

const getRandomDelay = (range: { min: number; max: number }, scale: number): number => {
  const value = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
  return Math.max(0, Math.round(value * scale));
};

const getTimestamp = (): string => new Date().toISOString().replace(/[:.]/g, '-');

const findTargetArticle = (
  row: SeedRunRow,
  publicCafe: PublicCafe | undefined,
): PublicArticle | undefined => {
  const candidates = (publicCafe?.articles || []).filter((article) => article.title === row.title);
  if (candidates.length === 0) return undefined;

  const sheetMatch = candidates.find((article) => article.articleId === publicCafe?.sheetArticleId);
  if (sheetMatch) return sheetMatch;

  return candidates.sort((a, b) => b.articleId - a.articleId)[0];
};

const buildTargets = (
  source: SeedRunArtifact,
  published: PublishedArtifact,
): { targets: EnqueueTarget[]; missing: Array<Record<string, unknown>> } => {
  const cafes = new Map((published.cafes || []).map((cafe) => [cafe.cafeId, cafe]));
  const targets: EnqueueTarget[] = [];
  const missing: Array<Record<string, unknown>> = [];

  for (const row of source.rows || []) {
    const article = findTargetArticle(row, cafes.get(row.cafeId));
    if (!article) {
      missing.push({
        cafeName: row.cafeName,
        cafeId: row.cafeId,
        title: row.title,
        reason: 'public article match not found',
      });
      continue;
    }

    targets.push({ row, article });
  }

  return { targets, missing };
};

const upsertPublishedArticle = async (target: EnqueueTarget): Promise<number> => {
  const { row, article } = target;
  const current = await PublishedArticle.findOne(
    { cafeId: row.cafeId, articleId: article.articleId },
    { comments: 1 },
  ).lean();

  await PublishedArticle.findOneAndUpdate(
    { cafeId: row.cafeId, articleId: article.articleId },
    {
      $set: {
        cafeId: row.cafeId,
        articleId: article.articleId,
        menuId: row.menuId,
        keyword: row.keyword,
        title: row.title,
        content: row.body,
        articleUrl: article.articleUrl,
        writerAccountId: row.ownerAccountId,
        status: 'published',
        postType: 'daily',
      },
      $setOnInsert: {
        publishedAt: new Date(),
        commentCount: 0,
        replyCount: 0,
        comments: [],
      },
    },
    { upsert: true, new: true },
  );

  return current?.comments?.length || 0;
};

const getExistingCommentRecordCount = async (target: EnqueueTarget): Promise<number> => {
  const current = await PublishedArticle.findOne(
    { cafeId: target.row.cafeId, articleId: target.article.articleId },
    { comments: 1 },
  ).lean();

  return current?.comments?.length || 0;
};

const getCommenterPool = (
  accounts: NaverAccount[],
  writerAccountId: string,
): NaverAccount[] => {
  const commenterRoleAccounts = accounts.filter(
    (account) => account.role === 'commenter' && account.id !== writerAccountId,
  );

  if (commenterRoleAccounts.length > 0) return commenterRoleAccounts;

  return accounts.filter((account) => account.id !== writerAccountId);
};

const pickOtherReplyAccount = (
  commenterPool: NaverAccount[],
  parentAccountId: string | undefined,
  lastReplyAccountId: string | undefined,
): string | undefined => {
  const excluded = new Set([parentAccountId, lastReplyAccountId].filter(Boolean));
  const candidates = commenterPool.filter((account) => !excluded.has(account.id));
  const fallback = commenterPool.filter((account) => account.id !== lastReplyAccountId);
  const pool = candidates.length > 0 ? candidates : fallback;

  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)].id;
};

const enqueueCommentsForTarget = async (
  target: EnqueueTarget,
  options: {
    accounts: NaverAccount[];
    userId: string;
    dryRun: boolean;
    delayScale: number;
    cafeOffsetMs: number;
    rescheduleToken: string;
  },
): Promise<Record<string, unknown>> => {
  const { row, article } = target;
  const generatedComments = row.generatedComments || [];
  const mainComments = generatedComments.filter((comment) => comment.type === 'comment');
  const accountMap = new Map(options.accounts.map((account) => [account.id, account]));
  const writerAccount = accountMap.get(row.ownerAccountId);
  const commenterPool = getCommenterPool(options.accounts, row.ownerAccountId);

  if (commenterPool.length < mainComments.length) {
    throw new Error(
      `${row.cafeName} commenter pool too small: ${commenterPool.length}/${mainComments.length}`,
    );
  }

  const existingCommentRecordCount = options.dryRun
    ? await getExistingCommentRecordCount(target)
    : await upsertPublishedArticle(target);
  if (existingCommentRecordCount > 0 && !hasFlag('--force')) {
    return {
      cafeName: row.cafeName,
      cafeId: row.cafeId,
      articleId: article.articleId,
      articleUrl: article.articleUrl,
      status: 'skipped-existing-comments',
      existingCommentRecordCount,
    };
  }

  const commentIndexMap = new Map<number, number>();
  const commentAuthorMap = new Map<number, string>();
  const commentContentMap = new Map<number, string>();

  mainComments.forEach((comment, index) => {
    const account = commenterPool[(index + options.cafeOffsetMs / BETWEEN_CAFE_OFFSET_MS) % commenterPool.length];
    commentIndexMap.set(comment.index, index);
    commentAuthorMap.set(comment.index, account.id);
    commentContentMap.set(comment.index, comment.content);
  });

  const sequenceId = `new_cafe_comments_${row.cafeId}_${getTimestamp()}`;
  let sequenceIndex = 0;
  let cumulativeDelay =
    options.cafeOffsetMs + getRandomDelay(FIRST_COMMENT_DELAY, options.delayScale);
  const jobs: Array<Record<string, unknown>> = [];
  const skipped: Array<Record<string, unknown>> = [];
  const lastReplyerByParent = new Map<number, string>();

  for (const item of generatedComments) {
    if (!item.content.trim()) continue;

    if (item.type === 'comment') {
      const accountId = commentAuthorMap.get(item.index);
      const commentIndex = commentIndexMap.get(item.index);
      if (!accountId || commentIndex === undefined) {
        skipped.push({ type: item.type, index: item.index, reason: 'comment account missing' });
        continue;
      }

      const jobData: CommentJobData = {
        type: 'comment',
        accountId,
        userId: options.userId,
        cafeId: row.cafeId,
        articleId: article.articleId,
        content: item.content,
        commentIndex,
        keyword: row.keyword,
        sequenceId,
        sequenceIndex,
        rescheduleToken: options.rescheduleToken,
      };

      if (!options.dryRun) await addTaskJob(accountId, jobData, cumulativeDelay);
      jobs.push({
        type: item.type,
        accountId,
        sequenceIndex,
        commentIndex,
        delayMs: cumulativeDelay,
        content: item.content,
      });
      sequenceIndex += 1;
      cumulativeDelay += getRandomDelay(BETWEEN_COMMENTS_DELAY, options.delayScale);
      continue;
    }

    if (item.parentIndex === undefined) {
      skipped.push({ type: item.type, index: item.index, reason: 'parentIndex missing' });
      continue;
    }

    const parentCommentIndex = commentIndexMap.get(item.parentIndex);
    const parentAccountId = commentAuthorMap.get(item.parentIndex);
    if (parentCommentIndex === undefined) {
      skipped.push({ type: item.type, index: item.index, reason: 'parent comment missing' });
      continue;
    }

    let accountId: string | undefined;
    if (item.type === 'author_reply') {
      accountId = writerAccount?.id;
      if (!accountId) {
        skipped.push({
          type: item.type,
          index: item.index,
          parentIndex: item.parentIndex,
          reason: 'writer account inactive or missing',
        });
        continue;
      }
    } else if (item.type === 'commenter_reply') {
      accountId = parentAccountId;
    } else {
      accountId = pickOtherReplyAccount(
        commenterPool,
        parentAccountId,
        lastReplyerByParent.get(item.parentIndex),
      );
    }

    if (!accountId) {
      skipped.push({ type: item.type, index: item.index, reason: 'reply account missing' });
      continue;
    }

    lastReplyerByParent.set(item.parentIndex, accountId);

    const jobData: ReplyJobData = {
      type: 'reply',
      accountId,
      userId: options.userId,
      cafeId: row.cafeId,
      articleId: article.articleId,
      content: item.content,
      commentIndex: parentCommentIndex,
      parentComment: commentContentMap.get(item.parentIndex),
      parentNickname: parentAccountId ? accountMap.get(parentAccountId)?.nickname : undefined,
      keyword: row.keyword,
      sequenceId,
      sequenceIndex,
      rescheduleToken: options.rescheduleToken,
    };

    if (!options.dryRun) await addTaskJob(accountId, jobData, cumulativeDelay);
    jobs.push({
      type: item.type,
      accountId,
      sequenceIndex,
      commentIndex: parentCommentIndex,
      delayMs: cumulativeDelay,
      content: item.content,
    });
    sequenceIndex += 1;
    cumulativeDelay += getRandomDelay(BETWEEN_COMMENTS_DELAY, options.delayScale);
  }

  return {
    cafeName: row.cafeName,
    cafeId: row.cafeId,
    articleId: article.articleId,
    articleUrl: article.articleUrl,
    title: row.title,
    writerAccountId: row.ownerAccountId,
    writerActive: Boolean(writerAccount),
    status: options.dryRun ? 'dry-run' : 'enqueued',
    requestedComments: generatedComments.length,
    enqueuedJobs: jobs.length,
    skippedJobs: skipped.length,
    mainComments: jobs.filter((job) => job.type === 'comment').length,
    replies: jobs.filter((job) => job.type !== 'comment').length,
    firstRunAt: jobs[0] ? new Date(Date.now() + Number(jobs[0].delayMs)).toISOString() : null,
    lastRunAt: jobs.at(-1)
      ? new Date(Date.now() + Number(jobs.at(-1)?.delayMs)).toISOString()
      : null,
    skipped,
    jobs,
  };
};

const writeArtifact = (payload: unknown): string => {
  const outputDir = join(process.cwd(), 'outputs');
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, `new-cafe-comment-enqueue-${getTimestamp()}.json`);
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  return outputPath;
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  const sourcePath = getArgValue('--source', DEFAULT_SOURCE_ARTIFACT);
  const publishedPath = getArgValue('--published', DEFAULT_PUBLISHED_ARTIFACT);
  const dryRun = hasFlag('--dry-run');
  const delayScale = Number(getArgValue('--delay-scale', process.env.DELAY_SCALE || '1'));
  const loginId = getArgValue('--login-id', LOGIN_ID);
  const rescheduleToken = getArgValue(
    '--reschedule-token',
    `new_cafe_comments_${Date.now().toString(36)}`,
  );

  const source = readJson<SeedRunArtifact>(sourcePath);
  const published = readJson<PublishedArtifact>(publishedPath);
  const { targets, missing } = buildTargets(source, published);

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${loginId}`);

  const accounts = await getAllAccounts(user.userId);
  if (accounts.length === 0) throw new Error('active accounts not found');

  const results: Array<Record<string, unknown>> = [];
  for (let index = 0; index < targets.length; index += 1) {
    const result = await enqueueCommentsForTarget(targets[index], {
      accounts,
      userId: user.userId,
      dryRun,
      delayScale,
      cafeOffsetMs: index * BETWEEN_CAFE_OFFSET_MS,
      rescheduleToken,
    });
    results.push(result);
  }

  const totals = results.reduce<EnqueueTotals>(
    (acc, result) => {
      acc.enqueuedJobs += Number(result.enqueuedJobs || 0);
      acc.mainComments += Number(result.mainComments || 0);
      acc.replies += Number(result.replies || 0);
      acc.skippedJobs += Number(result.skippedJobs || 0);
      return acc;
    },
    { enqueuedJobs: 0, mainComments: 0, replies: 0, skippedJobs: 0 },
  );

  const outputPath = writeArtifact({
    generatedAt: new Date().toISOString(),
    loginId: loginId,
    dryRun,
    delayScale,
    sourcePath,
    publishedPath,
    rescheduleToken,
    targetCount: targets.length,
    missing,
    totals,
    results,
  });

  console.log(`new cafe comments ${dryRun ? 'dry-run' : 'enqueue'} complete`);
  console.log(`targets: ${targets.length}, missing: ${missing.length}`);
  console.log(
    `jobs: ${totals.enqueuedJobs} (comments=${totals.mainComments}, replies=${totals.replies}, skipped=${totals.skippedJobs})`,
  );
  console.log(`artifact: ${outputPath}`);
};

main()
  .catch((error) => {
    console.error('enqueue-new-cafe-comments failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closeAllQueues();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(process.exitCode || 0);
  });
