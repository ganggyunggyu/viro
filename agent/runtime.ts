import { readCafeArticleContent } from '../src/shared/lib/cafe-article-reader';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { joinCafeWithNicknameRetry } from '../src/features/auto-comment/batch/cafe-join';
import { closeAllContexts } from '../src/shared/lib/multi-session';
import type { AgentConfig } from './lib/config';
import {
  createBrokerClient,
  type BrokerClient,
  type BrokerJob,
  type AgentCommentResult,
  type CommentAccount,
} from './lib/broker-client';

/**
 * 에이전트 런타임. 브로커에서 자기 잡을 pull → 로컬 브라우저(가정용 IP)로 댓글 게시 →
 * 결과 리포트. 모든 Mongo 접근은 브로커(서버)가 하고, 여기선 브라우저 실행만 한다.
 *
 * MVP는 fixed 모드(미리 준비된 댓글 텍스트)만 지원한다. generate/delete/agent 모드는 후속.
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

const resolveOwnerNickname = async (
  job: BrokerJob,
  readers: CommentAccount[],
): Promise<string> => {
  for (const reader of readers.slice(0, 3)) {
    const result = await readCafeArticleContent(
      toNaverAccount(reader),
      job.cafeId,
      job.articleId,
      { reason: `agent_read:${reader.accountId}` },
    );
    if (result.success && result.content) {
      return result.authorNickname || '';
    }
  }
  return '';
};

const processFixedJob = async (job: BrokerJob, broker: BrokerClient): Promise<void> => {
  log(job._id, `시작: ${job.cafeSlug}/${job.articleId} (mode=${job.mode})`);

  if (job.mode !== 'fixed') {
    await broker.report(job._id, {
      status: 'failed',
      errorMessage: `에이전트 MVP는 fixed 모드만 지원합니다 (현재: ${job.mode})`,
    });
    log(job._id, `건너뜀: ${job.mode} 모드 미지원(후속)`);
    return;
  }

  const texts = (job.fixedComments || []).map((text) => text.trim()).filter(Boolean);
  if (texts.length === 0) {
    await broker.report(job._id, { status: 'failed', errorMessage: 'fixedComments 없음' });
    return;
  }

  const readers = await broker.accounts();
  if (readers.length === 0) {
    await broker.report(job._id, { status: 'failed', errorMessage: '활성 commenter 계정 없음' });
    return;
  }

  await broker.heartbeat(job._id);
  const ownerNickname = await resolveOwnerNickname(job, readers);

  await broker.heartbeat(job._id);
  const pool = await broker.pool(job._id, ownerNickname, texts.length);
  const effectivePool = pool.length > 0 ? pool : readers;
  log(job._id, `계정 풀 ${effectivePool.length}개, 댓글 ${texts.length}개, 소유자="${ownerNickname}"`);

  const results: AgentCommentResult[] = [];
  let accountIdx = 0;
  let successCount = 0;

  for (let commentIdx = 0; commentIdx < texts.length; commentIdx += 1) {
    const content = texts[commentIdx];
    let posted = false;

    while (!posted && accountIdx < effectivePool.length) {
      const account = effectivePool[accountIdx];
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
    errorMessage: successCount === 0 ? '댓글을 하나도 등록하지 못함' : undefined,
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
      await processFixedJob(job, broker);
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
