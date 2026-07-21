import { readCafeArticleContent } from '../src/shared/lib/cafe-article-reader';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import {
  deleteCommentWithAccount,
  listLiveComments,
} from '../src/shared/lib/naver-cafe-writing/comment-deleter';
import { isNicknameEquivalent } from '../src/shared/lib/naver-cafe-writing/comment-writer-utils';
import { joinCafeWithNicknameRetry } from '../src/features/auto-comment/batch/cafe-join';
import { closeAllContexts } from '../src/shared/lib/multi-session';
import type { AgentConfig } from './lib/config';
import { resolveCommentPlan } from './lib/comment-plan';
import {
  createBrokerClient,
  type BrokerClient,
  type BrokerJob,
  type AgentArticleSnapshot,
  type AgentCommentResult,
  type AgentCommentDeleteResult,
  type CommentAccount,
} from './lib/broker-client';

/**
 * 에이전트 런타임. 브로커에서 자기 잡을 pull → 로컬 브라우저(가정용 IP)로 댓글 게시 →
 * 결과 리포트. 모든 Mongo 접근은 브로커(서버)가 하고, 여기선 브라우저 실행만 한다.
 *
 * 브라우저가 필요한 본문 읽기, 가입, 댓글 삭제/등록은 로컬에서 실행하고, AI 댓글 계획과
 * 계정/작업 DB 관리는 웹 브로커에 위임한다.
 */

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const randomDelay = (min: number, max: number): number =>
  Math.floor(min + Math.random() * Math.max(0, max - min));

const toNaverAccount = (account: CommentAccount) => ({
  id: account.accountId,
  password: account.password,
  nickname: account.nickname || account.accountId,
});

const log = (jobId: string, message: string): void => console.log(`[JOB ${jobId}] ${message}`);

const readArticleSnapshot = async (
  job: BrokerJob,
  readers: CommentAccount[],
): Promise<AgentArticleSnapshot | null> => {
  for (const reader of readers.slice(0, 3)) {
    const result = await readCafeArticleContent(
      toNaverAccount(reader),
      job.cafeId,
      job.articleId,
      { reason: `agent_read:${reader.accountId}` },
    );
    if (result.success && result.content) {
      return {
        title: result.title || '',
        body: result.content,
        ownerNickname: result.authorNickname || '',
      };
    }
  }
  return null;
};

const deleteExistingComments = async (
  job: BrokerJob,
  broker: BrokerClient,
  readers: CommentAccount[],
): Promise<AgentCommentDeleteResult[]> => {
  const previousResults = [...(job.deleteResults || [])];
  let liveComments: Array<{ commentId: string; nickname: string; content: string }> = [];

  for (const reader of readers.slice(0, 3)) {
    await broker.heartbeat(job._id);
    const listed = await listLiveComments(
      toNaverAccount(reader),
      job.cafeId,
      job.articleId,
    );
    if (listed.success && listed.comments) {
      liveComments = listed.comments;
      break;
    }
  }

  if (liveComments.length === 0) {
    log(job._id, '삭제할 라이브 댓글 없음');
    return previousResults;
  }

  const allAccounts = await broker.accounts('all');
  const results = [...previousResults];
  let resultIndex = results.length;

  for (const live of liveComments) {
    const candidates = allAccounts.filter((account) =>
      isNicknameEquivalent(live.nickname, account.nickname || account.accountId),
    );
    let deletedBy: CommentAccount | undefined;
    let error = candidates.length === 0
      ? '삭제 가능한 내 계정을 찾지 못함'
      : '댓글 삭제 실패';

    for (const account of candidates) {
      await broker.heartbeat(job._id);
      const deleted = await deleteCommentWithAccount(
        toNaverAccount(account),
        job.cafeId,
        job.articleId,
        live.commentId,
      );
      if (deleted.success) {
        deletedBy = account;
        break;
      }
      error = deleted.error || error;
    }

    results.push({
      index: resultIndex,
      commentId: live.commentId,
      accountId: deletedBy?.accountId,
      nickname: live.nickname,
      content: live.content,
      success: Boolean(deletedBy),
      error: deletedBy ? undefined : error,
      deletedAt: deletedBy ? new Date().toISOString() : undefined,
    });
    resultIndex += 1;
  }

  return results;
};

const processJob = async (job: BrokerJob, broker: BrokerClient): Promise<void> => {
  log(job._id, `시작: ${job.cafeSlug}/${job.articleId} (mode=${job.mode})`);

  const readers = await broker.accounts();
  if (readers.length === 0) {
    await broker.report(job._id, { status: 'failed', errorMessage: '활성 commenter 계정 없음' });
    return;
  }

  await broker.heartbeat(job._id);
  const article = await readArticleSnapshot(job, readers);
  if (!article) {
    await broker.report(job._id, { status: 'failed', errorMessage: '본문 읽기 실패' });
    return;
  }

  await broker.heartbeat(job._id);
  const plan = await resolveCommentPlan(job, article, (snapshot) => broker.plan(job._id, snapshot));
  const texts = plan.comments.map((text) => text.trim()).filter(Boolean);
  if (texts.length === 0) {
    await broker.report(job._id, {
      status: 'failed',
      errorMessage: '댓글 내용 생성/파싱 실패',
      agentSummary: plan.summary,
    });
    return;
  }

  const deleteResults = job.deleteExisting
    ? await deleteExistingComments(job, broker, readers)
    : [...(job.deleteResults || [])];
  const reusableAccountIds = deleteResults
    .filter(({ success, accountId }) => success && accountId)
    .map(({ accountId }) => accountId as string);

  await broker.heartbeat(job._id);
  const pool = await broker.pool(
    job._id,
    article.ownerNickname,
    texts.length,
    reusableAccountIds,
  );
  if (pool.length === 0) {
    await broker.report(job._id, {
      status: 'failed',
      deleteResults,
      errorMessage: '사용 가능한 댓글 계정 풀이 비어 있음',
      agentSummary: plan.summary,
    });
    return;
  }
  log(job._id, `계정 풀 ${pool.length}개, 댓글 ${texts.length}개, 소유자="${article.ownerNickname}"`);

  const results: AgentCommentResult[] = [...(job.results || [])];
  const alreadySucceededIndices = new Set(
    results.filter(({ success }) => success).map(({ index }) => index),
  );
  let accountIdx = 0;
  let successCount = alreadySucceededIndices.size;

  for (let commentIdx = 0; commentIdx < texts.length; commentIdx += 1) {
    if (alreadySucceededIndices.has(commentIdx)) {
      continue;
    }

    const content = texts[commentIdx];
    let posted = false;

    while (!posted && accountIdx < pool.length) {
      const account = pool[accountIdx];
      accountIdx += 1;

      await broker.heartbeat(job._id);

      const join = await joinCafeWithNicknameRetry(toNaverAccount(account), job.cafeId, {
        cafeUrl: job.cafeSlug,
      });
      if (!join.success) {
        results.push({
          index: commentIdx,
          accountId: account.accountId,
          nickname: account.nickname,
          content,
          success: false,
          error: `가입/닉네임 실패: ${join.error || '알 수 없음'}`,
        });
        continue;
      }

      const nickname = join.finalNickname || account.nickname || account.accountId;
      const write = await writeCommentWithAccount(
        toNaverAccount({ ...account, nickname }),
        job.cafeId,
        job.articleId,
        content,
      );

      results.push({
        index: commentIdx,
        accountId: account.accountId,
        nickname,
        content,
        success: write.success,
        commentId: write.commentId,
        error: write.success ? undefined : write.error,
        postedAt: write.success ? new Date().toISOString() : undefined,
      });

      if (write.success) {
        posted = true;
        successCount += 1;
        log(job._id, `게시 성공 ${commentIdx + 1}/${texts.length}: ${account.accountId}`);
      }
    }

    if (!posted) {
      log(job._id, `게시 실패 ${commentIdx + 1}/${texts.length}: 계정 풀 소진`);
    }

    if (posted && commentIdx < texts.length - 1) {
      await sleep(randomDelay(job.delayMinMs, job.delayMaxMs));
    }
  }

  await broker.report(job._id, {
    status: successCount > 0 ? 'done' : 'failed',
    results,
    deleteResults,
    errorMessage: successCount === 0 ? '댓글을 하나도 등록하지 못함' : undefined,
    agentSummary: plan.summary,
  });
  log(job._id, `완료: ${successCount}/${texts.length} 성공`);
};

export interface RunAgentLoopOptions {
  // 데스크톱 앱(Start/Stop)에서 프로그램적으로 루프를 멈추기 위한 훅.
  shouldStop?: () => boolean;
  // OS 시그널 핸들러 등록 여부. CLI 는 true(기본), 앱은 자체 관리하므로 false.
  handleSignals?: boolean;
}

export const runAgentLoop = async (
  config: AgentConfig,
  options: RunAgentLoopOptions = {},
): Promise<void> => {
  const { shouldStop, handleSignals = true } = options;
  const broker = createBrokerClient(config);
  let stopping = false;

  const requestStop = (): void => {
    if (!stopping) {
      console.log('\n[AGENT] 종료 신호 수신 - 현재 잡 마무리 후 종료합니다');
      stopping = true;
    }
  };

  if (handleSignals) {
    process.on('SIGINT', requestStop);
    process.on('SIGTERM', requestStop);
  }

  console.log(`[AGENT] 시작 workerId=${config.workerId} broker=${config.brokerUrl}`);

  while (!stopping && !(shouldStop?.() ?? false)) {
    let job: BrokerJob | null = null;

    try {
      job = await broker.claim();
    } catch (error) {
      console.error('[AGENT] claim 오류:', error instanceof Error ? error.message : error);
      await sleep(config.pollIntervalMs);
      continue;
    }

    if (!job) {
      await sleep(config.pollIntervalMs);
      continue;
    }

    try {
      await processJob(job, broker);
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error(`[JOB ${job._id}] 처리 오류:`, message);
      try {
        await broker.report(job._id, { status: 'failed', errorMessage: message });
      } catch (reportError) {
        console.error(`[JOB ${job._id}] 리포트 실패:`, reportError instanceof Error ? reportError.message : reportError);
      }
    }
  }

  await closeAllContexts();
  console.log('[AGENT] 종료됨');
};
