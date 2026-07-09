import mongoose from 'mongoose';
import { Account, ManualCommentJob, PublishedArticle, type IManualCommentJob } from '../src/shared/models';
import { hasCommented } from '../src/shared/models/published-article';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { readCafeArticleContent } from '../src/shared/lib/cafe-article-reader';
import { generateCafeCommentBatch } from '../src/shared/api/cafe-comment-batch-api';
import { runDeepSeekAgentCommentJob, type DeepSeekAgentEvent } from '../src/shared/lib/deepseek-agent-comment';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const WORKER_ID = `worker-${process.pid}-${Date.now()}`;
const POLL_INTERVAL_MS = 20_000;
const STALE_CLAIM_MS = 30 * 60_000;

const normalizeName = (v: string): string => (v || '').replace(/\([^)]*\)/g, '').replace(/\s+/g, '').trim();
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const randomDelay = (min: number, max: number): number =>
  Math.floor(min + Math.random() * Math.max(0, max - min));

const claimNextJob = async (): Promise<IManualCommentJob | null> => {
  const staleThreshold = new Date(Date.now() - STALE_CLAIM_MS);
  const job = await ManualCommentJob.findOneAndUpdate(
    {
      $or: [
        { status: 'pending' },
        { status: 'running', claimedAt: { $lt: staleThreshold } },
      ],
    },
    { $set: { status: 'running', claimedAt: new Date(), claimedBy: WORKER_ID } },
    { sort: { createdAt: 1 }, new: true },
  );
  return job;
};

const buildAccountPool = async (
  userId: string,
  cafeId: string,
  articleId: number,
  ownerNickname: string,
  needed: number,
): Promise<Array<{ accountId: string; password: string; nickname?: string }>> => {
  const commenterAccounts = await Account.find({
    userId,
    isActive: true,
    role: 'commenter',
    excludeFromAutoComment: { $ne: true },
  })
    .select('accountId password nickname')
    .lean<Array<{ accountId: string; password: string; nickname?: string }>>();

  const existing = await PublishedArticle.findOne({ cafeId, articleId }, { comments: 1 }).lean<{
    comments?: Array<{ accountId?: string }>;
  } | null>();
  const alreadyCommented = new Set((existing?.comments || []).map((c) => c.accountId).filter(Boolean) as string[]);

  const allDocs = await PublishedArticle.find({}, { comments: 1 }).lean<Array<{ comments?: Array<{ accountId?: string; createdAt?: Date }> }>>();
  const lastUsedAt = new Map<string, number>();
  for (const doc of allDocs) {
    for (const c of doc.comments || []) {
      if (!c.accountId || !c.createdAt) continue;
      const ts = new Date(c.createdAt).getTime();
      const prev = lastUsedAt.get(c.accountId) || 0;
      if (ts > prev) lastUsedAt.set(c.accountId, ts);
    }
  }

  const eligible = commenterAccounts.filter(
    (a) =>
      normalizeName(a.nickname || a.accountId) !== normalizeName(ownerNickname) &&
      !alreadyCommented.has(a.accountId),
  );

  const sorted = [...eligible].sort(
    (a, b) => (lastUsedAt.get(a.accountId) || 0) - (lastUsedAt.get(b.accountId) || 0),
  );

  return sorted.slice(0, Math.max(needed * 3, needed + 5));
};

const appendResult = async (
  jobId: mongoose.Types.ObjectId,
  result: {
    index: number;
    accountId?: string;
    nickname?: string;
    content: string;
    success: boolean;
    error?: string;
    commentId?: string;
  },
): Promise<void> => {
  await ManualCommentJob.updateOne(
    { _id: jobId },
    { $push: { results: { ...result, postedAt: new Date() } } },
  );
};

const processAgentJob = async (job: IManualCommentJob): Promise<void> => {
  console.log(`[JOB ${job._id}] 시작 (agent): ${job.cafeSlug}/${job.articleId}`);
  let resultIndex = 0;

  const onEvent = async (event: DeepSeekAgentEvent): Promise<void> => {
    if (event.type === 'post_success' || event.type === 'post_fail') {
      await appendResult(job._id as mongoose.Types.ObjectId, {
        index: resultIndex,
        accountId: event.accountId,
        nickname: event.nickname,
        content: event.content || event.message,
        success: event.type === 'post_success',
        error: event.type === 'post_fail' ? event.message : undefined,
        commentId: event.commentId,
      });
      resultIndex += 1;
    }
  };

  try {
    const { successCount, summary } = await runDeepSeekAgentCommentJob({
      userId: job.userId,
      cafeId: job.cafeId,
      cafeSlug: job.cafeSlug,
      articleId: job.articleId,
      onEvent,
    });

    await ManualCommentJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: successCount > 0 ? 'done' : 'failed',
          agentSummary: summary,
          errorMessage: successCount === 0 ? '에이전트가 댓글을 하나도 등록하지 못함' : undefined,
        },
      },
    );
    console.log(`[JOB ${job._id}] 종료 (agent): ${successCount}개 성공, summary="${summary}"`);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    await ManualCommentJob.updateOne({ _id: job._id }, { $set: { status: 'failed', errorMessage: message } });
    console.error(`[JOB ${job._id}] 실패 (agent): ${message}`);
  }
};

const processJob = async (job: IManualCommentJob): Promise<void> => {
  if (job.mode === 'agent') {
    await processAgentJob(job);
    return;
  }

  console.log(`[JOB ${job._id}] 시작: ${job.cafeSlug}/${job.articleId}`);

  const accountsForRead = await Account.find({
    userId: job.userId,
    isActive: true,
    role: 'commenter',
    excludeFromAutoComment: { $ne: true },
  })
    .select('accountId password nickname')
    .limit(3)
    .lean<Array<{ accountId: string; password: string; nickname?: string }>>();

  let articleTitle = '';
  let articleBody = '';
  let ownerNickname = '';
  let readError = '';

  for (const reader of accountsForRead) {
    const result = await readCafeArticleContent(
      { id: reader.accountId, password: reader.password, nickname: reader.nickname || reader.accountId },
      job.cafeId,
      job.articleId,
      { reason: `manual_comment_job_read:${reader.accountId}` },
    );
    if (result.success && result.content) {
      articleTitle = result.title || '';
      articleBody = result.content;
      ownerNickname = result.authorNickname || '';
      break;
    }
    readError = result.error || '본문 읽기 실패';
  }

  if (!articleBody) {
    await ManualCommentJob.updateOne(
      { _id: job._id },
      { $set: { status: 'failed', errorMessage: `본문 읽기 실패: ${readError}` } },
    );
    console.error(`[JOB ${job._id}] 실패: 본문 읽기 실패 (${readError})`);
    return;
  }

  let texts: string[] = [];
  if (job.mode === 'fixed') {
    texts = job.fixedComments || [];
  } else {
    const min = job.generateMinCount || 8;
    const max = job.generateMaxCount || 13;
    const exactCount = Math.floor(min + Math.random() * Math.max(0, max - min));
    let batch: Awaited<ReturnType<typeof generateCafeCommentBatch>> | null = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const candidate = await generateCafeCommentBatch({
        title: articleTitle || job.cafeSlug,
        body: articleBody,
        keyword: articleTitle,
        category: job.cafeSlug,
        exactCount,
        model: 'deepseek-v4-flash',
      });
      batch = candidate;
      if (candidate.comments.length >= exactCount) break;
    }
    texts = (batch?.comments || []).map((c) => c.content);
  }

  if (texts.length === 0) {
    await ManualCommentJob.updateOne(
      { _id: job._id },
      { $set: { status: 'failed', errorMessage: '댓글 내용 생성/파싱 실패' } },
    );
    console.error(`[JOB ${job._id}] 실패: 댓글 내용 없음`);
    return;
  }

  const pool = await buildAccountPool(job.userId, job.cafeId, job.articleId, ownerNickname, texts.length);
  console.log(`[JOB ${job._id}] 계정 풀 ${pool.length}개, 댓글 ${texts.length}개, 소유자 닉네임="${ownerNickname}"`);

  let accountIdx = 0;
  let successCount = 0;

  for (let commentIdx = 0; commentIdx < texts.length; commentIdx += 1) {
    const content = texts[commentIdx];
    let posted = false;

    while (!posted && accountIdx < pool.length) {
      const account = pool[accountIdx];
      accountIdx += 1;

      const already = await hasCommented(job.cafeId, job.articleId, account.accountId, 'comment');
      if (already) continue;

      const result = await writeCommentWithAccount(
        { id: account.accountId, password: account.password, nickname: account.nickname || account.accountId },
        job.cafeId,
        job.articleId,
        content,
      );

      if (!result.success) {
        console.error(`[JOB ${job._id}] FAIL ${account.accountId}: ${result.error}`);
        await appendResult(job._id as mongoose.Types.ObjectId, {
          index: commentIdx,
          accountId: account.accountId,
          nickname: account.nickname,
          content,
          success: false,
          error: result.error,
        });
        await sleep(15_000);
        continue;
      }

      const { addCommentToArticle } = await import('../src/shared/models');
      await addCommentToArticle(job.cafeId, job.articleId, {
        accountId: account.accountId,
        nickname: account.nickname || account.accountId,
        content,
        type: 'comment',
        commentId: result.commentId,
      });
      await appendResult(job._id as mongoose.Types.ObjectId, {
        index: commentIdx,
        accountId: account.accountId,
        nickname: account.nickname,
        content,
        success: true,
        commentId: result.commentId,
      });
      console.log(`[JOB ${job._id}] SUCCESS ${successCount + 1}/${texts.length} ${account.accountId}`);
      successCount += 1;
      posted = true;

      if (commentIdx < texts.length - 1) {
        const delayMs = randomDelay(job.delayMinMs, job.delayMaxMs);
        console.log(`[JOB ${job._id}] 다음 댓글까지 ${Math.round(delayMs / 1000)}초 대기`);
        await sleep(delayMs);
      }
    }
  }

  await ManualCommentJob.updateOne(
    { _id: job._id },
    { $set: { status: successCount > 0 ? 'done' : 'failed', errorMessage: successCount === 0 ? '모든 계정 시도 실패' : undefined } },
  );
  console.log(`[JOB ${job._id}] 종료: ${successCount}/${texts.length} 성공`);
};

const runLoop = async (): Promise<void> => {
  console.log(`[WORKER] 시작 (${WORKER_ID}), ${POLL_INTERVAL_MS / 1000}초마다 폴링`);

  while (true) {
    try {
      const job = await claimNextJob();
      if (job) {
        await processJob(job);
        continue;
      }
    } catch (error) {
      console.error('[WORKER] 처리 중 오류:', error instanceof Error ? error.message : error);
    }
    await sleep(POLL_INTERVAL_MS);
  }
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  process.on('SIGINT', async () => {
    console.log('\n[WORKER] 종료 신호 수신, 정리 중...');
    await closeAllContexts();
    await mongoose.disconnect();
    process.exit(0);
  });

  await runLoop();
};

main().catch((error) => {
  console.error('run-manual-comment-worker failed:', error);
  process.exit(1);
});
