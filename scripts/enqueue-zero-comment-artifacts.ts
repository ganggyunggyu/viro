import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import mongoose from 'mongoose';
import { ManualCommentJob, User } from '../src/shared/models';

interface CollectedArticle {
  articleId: number;
  subject: string;
  commentCount: number;
  writeDateTimestamp: number;
  articleUrl: string;
}

interface CollectedCafe {
  cafeSlug: string;
  cafeId?: string;
  status: 'ok' | 'failed';
  zeroCommentArticles?: CollectedArticle[];
}

interface CollectionArtifact {
  generatedAt: string;
  cafes: CollectedCafe[];
}

interface QueueTarget extends CollectedArticle {
  cafeSlug: string;
  cafeId: string;
}

const COMMENT_COUNT = 8;
const DELAY_MIN_MS = 10_000;
const DELAY_MAX_MS = 20_000;
const args = process.argv.slice(2);

const getArgValue = (name: string, fallback = ''): string => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
};

const hasFlag = (name: string): boolean => args.includes(name);

const loadTargets = (sourcePaths: string[]): QueueTarget[] => {
  const byArticle = new Map<string, QueueTarget>();

  for (const sourcePath of sourcePaths) {
    const artifact = JSON.parse(readFileSync(resolve(sourcePath), 'utf-8')) as CollectionArtifact;
    for (const cafe of artifact.cafes) {
      if (cafe.status !== 'ok' || !cafe.cafeId) continue;

      for (const article of cafe.zeroCommentArticles || []) {
        if (Number(article.commentCount) !== 0) continue;
        const target = { ...article, cafeSlug: cafe.cafeSlug, cafeId: cafe.cafeId };
        byArticle.set(`${target.cafeId}:${target.articleId}`, target);
      }
    }
  }

  return [...byArticle.values()].sort((a, b) =>
    b.writeDateTimestamp - a.writeDateTimestamp
    || b.articleId - a.articleId
    || a.cafeId.localeCompare(b.cafeId),
  );
};

const writeArtifact = (payload: unknown): string => {
  const outputDir = join(process.cwd(), 'outputs');
  mkdirSync(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = join(outputDir, `zero-comment-latest-first-queue-${timestamp}.json`);
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  return outputPath;
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  const sourcePaths = getArgValue('--sources')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (sourcePaths.length === 0) throw new Error('--sources is required');

  const loginId = getArgValue('--login-id', '21lab');
  const apply = hasFlag('--apply');
  const replaceActive = hasFlag('--replace-active');
  const targets = loadTargets(sourcePaths);

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  const user = await User.findOne({ loginId, isActive: true }).lean<{ userId: string } | null>();
  if (!user) throw new Error(`user not found: ${loginId}`);

  const activeFilter = {
    userId: user.userId,
    mode: 'generate',
    status: { $in: ['pending', 'running'] },
  };
  const activeBefore = await ManualCommentJob.countDocuments(activeFilter);
  const preview = {
    sourcePaths,
    targetArticles: targets.length,
    targetComments: targets.length * COMMENT_COUNT,
    order: 'writeDateTimestamp desc',
    delayMs: { min: DELAY_MIN_MS, max: DELAY_MAX_MS },
    activeBefore,
    replaceActive,
    newestTargets: targets.slice(0, 10).map((target) => ({
      cafeSlug: target.cafeSlug,
      cafeId: target.cafeId,
      articleId: target.articleId,
      subject: target.subject,
      writeDateTimestamp: target.writeDateTimestamp,
      articleUrl: target.articleUrl,
    })),
  };

  if (!apply) {
    console.log(JSON.stringify({ apply: false, ...preview }, null, 2));
    await mongoose.disconnect();
    return;
  }
  if (!replaceActive) {
    throw new Error('--apply requires --replace-active to preserve latest-first ordering');
  }

  const replaced = await ManualCommentJob.updateMany(
    activeFilter,
    {
      $set: {
        status: 'failed',
        errorMessage: '현재 댓글 0개 전수 결과 기준 최신글 우선 작업으로 교체됨',
      },
      $unset: { claimedAt: '', claimedBy: '' },
    },
  );

  const queueStartedAt = Date.now();
  const queued: Array<{ jobId: string; cafeId: string; articleId: number; writeDateTimestamp: number }> = [];
  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index];
    const createdAt = new Date(queueStartedAt + index);
    const job = await ManualCommentJob.create({
      userId: user.userId,
      articleUrl: target.articleUrl,
      cafeSlug: target.cafeSlug,
      cafeId: target.cafeId,
      articleId: target.articleId,
      mode: 'generate',
      generateMinCount: COMMENT_COUNT,
      generateMaxCount: COMMENT_COUNT,
      delayMinMs: DELAY_MIN_MS,
      delayMaxMs: DELAY_MAX_MS,
      deleteExisting: false,
      status: 'pending',
      results: [],
      deleteResults: [],
      createdAt,
      updatedAt: createdAt,
    });
    queued.push({
      jobId: String(job._id),
      cafeId: target.cafeId,
      articleId: target.articleId,
      writeDateTimestamp: target.writeDateTimestamp,
    });
  }

  const outputPath = writeArtifact({
    appliedAt: new Date().toISOString(),
    ...preview,
    replacedJobs: replaced.modifiedCount,
    queuedJobs: queued.length,
    queued,
  });

  console.log(JSON.stringify({
    apply: true,
    targetArticles: targets.length,
    targetComments: targets.length * COMMENT_COUNT,
    replacedJobs: replaced.modifiedCount,
    queuedJobs: queued.length,
    outputPath,
  }, null, 2));
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error('enqueue-zero-comment-artifacts failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
