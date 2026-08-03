import mongoose from 'mongoose';
import { setServers } from 'node:dns';
import { Account, Cafe, ManualCommentJob, PublishedArticle, type IManualCommentJob } from '../src/shared/models';
import { hasCommented, removeCommentFromArticle } from '../src/shared/models/published-article';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { listLiveComments, deleteCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-deleter';
import { readCafeArticleContent } from '../src/shared/lib/cafe-article-reader';
import {
  CAFE_COMMENT_COUNT,
  generateCafeCommentBatch,
  resolveCafeCommentKeyword,
} from '../src/shared/api/cafe-comment-batch-api';
import { runDeepSeekAgentCommentJob, type DeepSeekAgentEvent } from '../src/shared/lib/deepseek-agent-comment';
import {
  closeAllContexts,
  getPageForAccount,
  reserveAccountSession,
} from '../src/shared/lib/multi-session';
import { joinCafeWithNicknameRetry } from '../src/features/auto-comment/batch/cafe-join';
import { isNicknameEquivalent } from '../src/shared/lib/naver-cafe-writing/comment-writer-utils';

const WORKER_ID = `worker-${process.pid}-${Date.now()}`;
const POLL_INTERVAL_MS = 20_000;
const STALE_CLAIM_MS = 30 * 60_000;
const TARGET_JOB_IDS = (process.env.MANUAL_COMMENT_JOB_IDS || '').split(',').filter(Boolean);
const reservedCommentAccountIds = new Set<string>();

const normalizeName = (v: string): string => (v || '').replace(/\([^)]*\)/g, '').replace(/\s+/g, '').trim();
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const randomDelay = (min: number, max: number): number =>
  Math.floor(min + Math.random() * Math.max(0, max - min));

const reserveNextCommentAccount = async <T extends { accountId: string }>(
  pool: T[],
  attemptedAccountIds: Set<string>,
): Promise<T | null> => {
  while (true) {
    const available = pool.find(
      ({ accountId }) =>
        !attemptedAccountIds.has(accountId) && !reservedCommentAccountIds.has(accountId),
    );
    if (available) {
      attemptedAccountIds.add(available.accountId);
      reservedCommentAccountIds.add(available.accountId);
      return available;
    }

    const hasUnattemptedAccount = pool.some(
      ({ accountId }) => !attemptedAccountIds.has(accountId),
    );
    if (!hasUnattemptedAccount) return null;

    await sleep(500);
  }
};

const releaseCommentAccount = (accountId: string): void => {
  reservedCommentAccountIds.delete(accountId);
};

const claimNextJob = async (): Promise<IManualCommentJob | null> => {
  const staleThreshold = new Date(Date.now() - STALE_CLAIM_MS);
  const job = await ManualCommentJob.findOneAndUpdate(
    {
      ...(TARGET_JOB_IDS.length > 0 ? { _id: { $in: TARGET_JOB_IDS } } : {}),
      $or: [
        { status: 'pending' },
        { status: 'running', claimedAt: { $lt: staleThreshold } },
      ],
    },
    { $set: { status: 'running', claimedAt: new Date(), claimedBy: WORKER_ID } },
    // 운영 요청 기준: 같은 대기열에서는 최신 글부터 댓글을 채운다.
    { sort: { createdAt: -1 }, new: true },
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

  // 전체 발행 이력을 모두 역직렬화하면 댓글 하나를 재작성하는 작업도 수 분간
  // 멈출 수 있다. 최근 이력만으로도 계정 분산에는 충분하므로 범위를 제한한다.
  const allDocs = await PublishedArticle.find({}, { comments: 1 })
    .sort({ updatedAt: -1 })
    .limit(500)
    .lean<Array<{ comments?: Array<{ accountId?: string; createdAt?: Date }> }>>();
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

  // LRU 정렬은 전역 결정적 순서라 모든 슬롯이 같은 pool[0]을 첫 타겟으로 잡는다.
  // lastUsedAt은 댓글이 성공해야 갱신되므로 대기 중에는 순서도 바뀌지 않아,
  // 슬롯 하나를 뺀 나머지가 전부 acquireAccountLock 타임아웃까지 묶인다(락 convoy).
  // 잡마다 시작 오프셋을 달리해 슬롯들이 서로 다른 계정부터 집도록 분산한다.
  const offset = sorted.length > 0 ? articleId % sorted.length : 0;
  const rotated = [...sorted.slice(offset), ...sorted.slice(0, offset)];

  return rotated.slice(0, Math.max(needed * 3, needed + 5));
};

/**
 * 잡이 살아서 진행 중임을 표시하는 하트비트는 appendResult/appendDeleteResult가 겸한다.
 * claimNextJob의 stale 재claim(30분) 기준이 claimedAt 하나뿐이라, 계정 락 대기·재시도가
 * 겹쳐 한 잡이 30분을 넘기면 다른 슬롯이 살아있는 잡을 죽은 걸로 오판해 처음부터 재처리
 * → 댓글 중복 게시로 이어졌던 사고가 있었음. 결과를 남길 때마다 claimedAt을 갱신한다.
 */
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
    { $push: { results: { ...result, postedAt: new Date() } }, $set: { claimedAt: new Date() } },
  );
};

const appendDeleteResult = async (
  jobId: mongoose.Types.ObjectId,
  result: {
    index: number;
    commentId: string;
    accountId?: string;
    nickname?: string;
    content: string;
    success: boolean;
    error?: string;
  },
): Promise<void> => {
  await ManualCommentJob.updateOne(
    { _id: jobId },
    { $push: { deleteResults: { ...result, deletedAt: new Date() } }, $set: { claimedAt: new Date() } },
  );
};

/**
 * job.deleteExisting이 true일 때 posting 전에 호출. DB(comments 배열)가 아니라
 * 라이브 댓글을 기준으로 삭제 대상을 정한다 — DB 기록이 실제 게시 여부와 어긋나는 경우가 있었음.
 * 개별 댓글 삭제 실패(캡차 로그인 실패 등)는 잡 전체를 막지 않고 해당 댓글만 원본 유지한 채 계속 진행한다.
 */
const deleteExistingComments = async (
  job: IManualCommentJob,
  accountsForRead: Array<{ accountId: string; password: string; nickname?: string }>,
): Promise<void> => {
  console.log(`[JOB ${job._id}] 기존 댓글 삭제 시작: ${job.cafeSlug}/${job.articleId}`);

  let liveComments: Array<{ commentId: string; nickname: string; content: string }> = [];
  for (const reader of accountsForRead) {
    const result = await listLiveComments(
      { id: reader.accountId, password: reader.password, nickname: reader.nickname || reader.accountId },
      job.cafeId,
      job.articleId,
    );
    if (result.success && result.comments) {
      liveComments = result.comments;
      break;
    }
  }

  if (liveComments.length === 0) {
    console.log(`[JOB ${job._id}] 삭제할 라이브 댓글 없음`);
    return;
  }

  // 댓글 DB 기록은 실제 네이버 상태와 어긋날 수 있으므로 삭제 계정 판정에 사용하지 않는다.
  // 현재 사용자의 활성 계정으로 차례로 시도하고, 실제 작성 계정에서만 네이버가 삭제 메뉴를 노출한다.
  const deleteAccounts = await Account.find({ userId: job.userId, isActive: true })
    .select('accountId password nickname')
    .lean<Array<{ accountId: string; password: string; nickname?: string }>>();

  let resultIndex = 0;
  for (const live of liveComments) {
    let deletedBy: { accountId: string; password: string; nickname?: string } | undefined;
    let deleteError = '삭제 가능한 내 계정을 찾지 못함';

    // 실제 UI에 보이는 닉네임과 활성 계정을 먼저 매칭한다. 기존처럼 모든 계정으로
    // 삭제 권한을 순회하면 한 댓글당 수십 번의 페이지 이동이 발생해 전체 작업이 멈춘다.
    const matchingAccounts = deleteAccounts.filter((account) =>
      isNicknameEquivalent(live.nickname, account.nickname || account.accountId),
    );
    const candidates = matchingAccounts;

    for (const account of candidates) {
      const deleteResult = await deleteCommentWithAccount(
        { id: account.accountId, password: account.password, nickname: account.nickname || account.accountId },
        job.cafeId,
        job.articleId,
        live.commentId,
      );
      if (deleteResult.success) {
        deletedBy = account;
        break;
      }
      deleteError = deleteResult.error || deleteError;
    }

    await appendDeleteResult(job._id as mongoose.Types.ObjectId, {
      index: resultIndex,
      commentId: live.commentId,
      accountId: deletedBy?.accountId,
      nickname: live.nickname,
      content: live.content,
      success: Boolean(deletedBy),
      error: deletedBy ? undefined : deleteError,
    });
    resultIndex += 1;

    if (deletedBy) {
      await removeCommentFromArticle(job.cafeId, job.articleId, live.commentId);
      console.log(`[JOB ${job._id}] 삭제 성공: ${deletedBy.accountId} / ${live.commentId}`);
    } else {
      console.log(`[JOB ${job._id}] 삭제 실패: ${live.commentId} - ${deleteError}`);
    }
  }

  console.log(`[JOB ${job._id}] 기존 댓글 삭제 종료`);
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

  const commenterReaders = await Account.find({
    userId: job.userId,
    isActive: true,
    role: 'commenter',
    excludeFromAutoComment: { $ne: true },
  })
    .select('accountId password nickname')
    .lean<Array<{ accountId: string; password: string; nickname?: string }>>();

  // 정렬 없는 limit(3)은 모든 잡에 같은 계정 3개를 같은 순서로 주므로, 슬롯 전체가
  // 본문 읽기 단계에서 같은 계정 락을 두고 경합한다. 잡마다 시작 오프셋을 달리해
  // 슬롯들이 서로 다른 계정으로 본문을 읽도록 분산한다.
  const readOffset = commenterReaders.length > 0 ? job.articleId % commenterReaders.length : 0;
  const rotatedCommenterReaders = [
    ...commenterReaders.slice(readOffset),
    ...commenterReaders.slice(0, readOffset),
  ];

  // 같은 카페의 최근 성공 작업에서 실제 댓글 등록에 성공한 계정은 가입이 검증된
  // 회원이다. 여러 최신 글을 동시에 처리할 때 동일 소유 계정 락으로 몰리지 않도록
  // 이 계정들을 잡별 회전 순서대로 본문 읽기 후보의 앞에 둔다.
  const recentSuccessfulJobs = await ManualCommentJob.find({
    _id: { $ne: job._id },
    userId: job.userId,
    cafeId: job.cafeId,
    status: 'done',
    'results.success': true,
  })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('results.accountId results.success')
    .lean<Array<{ results?: Array<{ accountId?: string; success?: boolean }> }>>();
  const knownMemberIds = new Set(
    recentSuccessfulJobs.flatMap(({ results = [] }) =>
      results
        .filter(({ accountId, success }) => accountId && success)
        .map(({ accountId }) => accountId as string),
    ),
  );
  const knownMemberReaders = rotatedCommenterReaders.filter(
    ({ accountId }) => knownMemberIds.has(accountId),
  );
  const unverifiedCommenterReaders = rotatedCommenterReaders.filter(
    ({ accountId }) => !knownMemberIds.has(accountId),
  );

  // 댓글 계정은 아직 대상 카페에 가입하지 않았을 수 있다. 카페 소유 계정은 글을
  // 작성한 회원이므로 본문을 가장 안정적으로 읽을 수 있어 첫 후보로 둔다.
  const cafe = await Cafe.findOne({
    userId: job.userId,
    cafeId: job.cafeId,
    isActive: true,
  })
    .select('ownerAccountId')
    .lean<{ ownerAccountId?: string } | null>();
  const ownerReader = cafe?.ownerAccountId
    ? await Account.findOne({
      userId: job.userId,
      accountId: cafe.ownerAccountId,
      isActive: true,
    })
      .select('accountId password nickname')
      .lean<{ accountId: string; password: string; nickname?: string } | null>()
    : null;
  const accountsForRead = [
    ...knownMemberReaders,
    ...(ownerReader ? [ownerReader] : []),
    ...unverifiedCommenterReaders.filter(
      ({ accountId }) => accountId !== ownerReader?.accountId,
    ),
  ];

  let articleTitle = '';
  let articleBody = '';
  let ownerNickname = '';
  let readError = '';

  readLoop: for (const reader of accountsForRead) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
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
        break readLoop;
      }
      readError = result.error || '본문 읽기 실패';
      const shouldRetrySameReader = /ARTICLE_NOT_READY|Execution context|navigation|Target page|net::ERR/i.test(readError);
      if (attempt < 2 && shouldRetrySameReader) {
        await sleep(2_000);
        continue;
      }
      break;
    }
  }

  if (!articleBody) {
    await ManualCommentJob.updateOne(
      { _id: job._id },
      { $set: { status: 'failed', errorMessage: `본문 읽기 실패: ${readError}` } },
    );
    console.error(`[JOB ${job._id}] 실패: 본문 읽기 실패 (${readError})`);
    return;
  }

  if (job.deleteExisting) {
    // buildAccountPool이 PublishedArticle.comments 기준으로 "이미 댓글단 계정"을 제외하므로,
    // 삭제의 DB 반영($pull)이 완료된 뒤에 계정 풀을 구성해야 방금 삭제한 계정이 재작성 후보로 돌아온다.
    await deleteExistingComments(job, accountsForRead);
  }

  let texts: string[] = [];
  if (job.mode === 'fixed') {
    texts = job.fixedComments || [];
  } else {
    const storedArticle = await PublishedArticle.findOne(
      { cafeId: job.cafeId, articleId: job.articleId },
      { keyword: 1 },
    ).lean<{ keyword?: string } | null>();
    const commentKeyword = resolveCafeCommentKeyword(storedArticle?.keyword, articleTitle || job.cafeSlug);
    const commentModel = process.env.MANUAL_COMMENT_GEN_MODEL
      || process.env.CAFE_COMMENT_MODEL
      || 'gpt-5.6-luna';
    let batch: Awaited<ReturnType<typeof generateCafeCommentBatch>> | null = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const candidate = await generateCafeCommentBatch({
        keyword: commentKeyword,
        title: articleTitle,
        body: articleBody,
        model: commentModel,
      });
      batch = candidate;
      if (candidate.comments.length >= CAFE_COMMENT_COUNT) break;
    }
    texts = (batch?.comments || []).map((c) => c.content).slice(0, CAFE_COMMENT_COUNT);
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

  let successCount = 0;
  const attemptedAccountIds = new Set<string>();

  // 재claim(하트비트 갭, 프로세스 재시작 등)으로 같은 잡이 다시 처리될 때 이미 성공한
  // 인덱스를 또 게시하지 않도록 건너뛴다. job은 claim 시점 스냅샷이라 이전 시도의 results가 남아있다.
  const alreadySucceededIndices = new Set(
    (job.results || []).filter((r) => r.success).map((r) => r.index),
  );

  for (let commentIdx = 0; commentIdx < texts.length; commentIdx += 1) {
    if (alreadySucceededIndices.has(commentIdx)) {
      successCount += 1;
      console.log(`[JOB ${job._id}] 인덱스 ${commentIdx} 이미 성공 처리됨 - 건너뜀`);
      continue;
    }

    const content = texts[commentIdx];
    let posted = false;

    while (!posted) {
      const account = await reserveNextCommentAccount(pool, attemptedAccountIds);
      if (!account) break;

      try {
        const already = await hasCommented(job.cafeId, job.articleId, account.accountId, 'comment');
        if (already) continue;

        const joinResult = await joinCafeWithNicknameRetry(
          { id: account.accountId, password: account.password, nickname: account.nickname || account.accountId },
          job.cafeId,
          {
            cafeUrl: job.cafeSlug,
            updateDbNickname: async (nickname) => {
              await Account.updateOne({ userId: job.userId, accountId: account.accountId }, { $set: { nickname } });
            },
          },
        );
        if (!joinResult.success) {
          console.error(`[JOB ${job._id}] JOIN FAIL ${account.accountId}: ${joinResult.error}`);
          await appendResult(job._id as mongoose.Types.ObjectId, {
            index: commentIdx,
            accountId: account.accountId,
            nickname: account.nickname,
            content,
            success: false,
            error: `카페 가입 확인 실패: ${joinResult.error}`,
          });
          continue;
        }

        const nickname = joinResult.finalNickname || account.nickname || account.accountId;
        const result = await writeCommentWithAccount(
          { id: account.accountId, password: account.password, nickname },
          job.cafeId,
          job.articleId,
          content,
        );

        if (!result.success) {
          console.error(`[JOB ${job._id}] FAIL ${account.accountId}: ${result.error}`);
          await appendResult(job._id as mongoose.Types.ObjectId, {
            index: commentIdx,
            accountId: account.accountId,
            nickname,
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
          nickname,
          content,
          type: 'comment',
          commentId: result.commentId,
        });
        await appendResult(job._id as mongoose.Types.ObjectId, {
          index: commentIdx,
          accountId: account.accountId,
          nickname,
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
      } finally {
        releaseCommentAccount(account.accountId);
      }
    }
  }

  await ManualCommentJob.updateOne(
    { _id: job._id },
    { $set: { status: successCount > 0 ? 'done' : 'failed', errorMessage: successCount === 0 ? '모든 계정 시도 실패' : undefined } },
  );
  console.log(`[JOB ${job._id}] 종료: ${successCount}/${texts.length} 성공`);
};

// 잡을 동시에 여러 개 처리하되, 같은 프로세스 안에서만 병렬화한다.
// pm2 프로세스를 여러 개 띄우는 방식은 acquireAccountLock이 프로세스 메모리 기반이라
// 서로 다른 프로세스 간에는 같은 네이버 계정 동시 조작을 막지 못해 위험함.
// 슬롯을 여러 개 두되 전부 한 프로세스 안에서 돌리면 락이 정상적으로 동작한다.
// 슬롯 하나가 한 번에 계정 하나를 점유(acquireAccountLock)하므로 동시 슬롯과 브라우저
// 컨텍스트를 활성 commenter 계정 수에 정확히 맞춘다. 시작 시 모든 계정 컨텍스트를 예약해
// idle cleanup이 작업 도중 세션 수를 줄이지 않도록 유지한다.
const DEFAULT_MONGODB_DNS_SERVERS = ['8.8.8.8', '1.1.1.1'];

type CommenterSessionAccount = {
  accountId: string;
};
const DEFAULT_WORKER_CONCURRENCY = 6;

const configureMongoDbDns = (uri: string): void => {
  if (!uri.startsWith('mongodb+srv://')) return;

  const servers = (process.env.MONGODB_DNS_SERVERS || DEFAULT_MONGODB_DNS_SERVERS.join(','))
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
  if (servers.length === 0) return;

  setServers(servers);
  console.log(`[WORKER] MongoDB DNS resolver ${servers.join(', ')}`);
};

const loadCommenterSessionAccounts = async (): Promise<CommenterSessionAccount[]> => {
  return Account.find({
    isActive: true,
    role: 'commenter',
    excludeFromAutoComment: { $ne: true },
  })
    .select('accountId')
    .lean<CommenterSessionAccount[]>();
};

const warmCommenterSessions = async (
  accounts: CommenterSessionAccount[],
): Promise<void> => {
  const results = await Promise.allSettled(
    accounts.map(async ({ accountId }) => {
      reserveAccountSession(accountId, WORKER_ID);
      await getPageForAccount(accountId);
    }),
  );

  const failedCount = results.filter((result) => result.status === 'rejected').length;
  if (failedCount > 0) {
    throw new Error(`댓글 계정 브라우저 세션 생성 실패: ${failedCount}/${accounts.length}`);
  }

  console.log(`[WORKER] 댓글 계정 브라우저 세션 ${accounts.length}/${accounts.length}개 준비 완료`);
};

const resolveWorkerConcurrency = (sessionCount: number): number => {
  const requested = Number(process.env.WORKER_CONCURRENCY || DEFAULT_WORKER_CONCURRENCY);
  const safeRequested = Number.isFinite(requested) && requested > 0
    ? Math.floor(requested)
    : DEFAULT_WORKER_CONCURRENCY;
  return Math.min(safeRequested, sessionCount);
};

const runWorkerSlot = async (slotId: number): Promise<void> => {
  while (true) {
    try {
      const job = await claimNextJob();
      if (job) {
        // processJob 중간에서 던진 예외(락 타임아웃 등)를 여기서만 잡으면 잡은 status가
        // running인 채로 남아 stale 재활용(30분) 전까지 아무도 손대지 못한다.
        // 실패를 잡에 기록해야 큐 상태가 실제와 맞는다.
        try {
          await processJob(job);
        } catch (error) {
          const message = error instanceof Error ? error.message : '알 수 없는 오류';
          await ManualCommentJob.updateOne(
            { _id: job._id },
            { $set: { status: 'failed', errorMessage: message } },
          );
          console.error(`[JOB ${job._id}] 실패: ${message}`);
        }
        continue;
      }
      if (TARGET_JOB_IDS.length > 0) return;
    } catch (error) {
      console.error(`[WORKER-${slotId}] 처리 중 오류:`, error instanceof Error ? error.message : error);
    }
    await sleep(POLL_INTERVAL_MS);
  }
};

const runLoop = async (concurrency: number): Promise<void> => {
  console.log(
    `[WORKER] 시작 (${WORKER_ID}), 동시 슬롯 ${concurrency}개(활성 commenter 계정 수 기준), ${POLL_INTERVAL_MS / 1000}초마다 폴링`,
  );

  await Promise.all(
    Array.from({ length: concurrency }, (_, i) => runWorkerSlot(i + 1)),
  );
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  configureMongoDbDns(process.env.MONGODB_URI);
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  process.on('SIGINT', async () => {
    console.log('\n[WORKER] 종료 신호 수신, 정리 중...');
    await closeAllContexts();
    await mongoose.disconnect();
    process.exit(0);
  });

  const commenterAccounts = await loadCommenterSessionAccounts();
  if (commenterAccounts.length === 0) throw new Error('활성 commenter 계정 없음');

  await warmCommenterSessions(commenterAccounts);
  await runLoop(resolveWorkerConcurrency(commenterAccounts.length));
};

main().catch((error) => {
  console.error('run-manual-comment-worker failed:', error);
  process.exit(1);
});
