import { CommentJobData, JobResult } from '../types';
import { addTaskJob, createRescheduleToken } from '../index';
import { waitForSequenceTurn, advanceSequence } from '../sequence';
import { writeCommentWithAccount } from '@/shared/lib/naver-cafe-writing';
import { NaverAccount } from '@/shared/lib/account-manager';
import { hasCommented, addCommentToArticle, getArticleIdByKeyword } from '@/shared/models';
import { invalidateLoginCache } from '@/shared/lib/multi-session';
import { getRedisConnection } from '@/shared/lib/redis';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('COMMENT');

const WRITE_LOCK_TTL = 600; // 10분
const SEQUENCE_WAIT_RETRY_MS = 10 * 1000;
const ARTICLE_LOOKUP_RETRY_MS = 2 * 60 * 1000;
const ARTICLE_NOT_READY_RETRY_MS = 5 * 60 * 1000;
const WRITE_LOCK_RETRY_MS = 60 * 1000;
const WRITE_FAIL_RETRY_MS = 60 * 1000;
const MAX_TRANSIENT_RETRY = 3;

const acquireWriteLock = async (
  cafeId: string,
  articleId: number,
  accountId: string,
  content: string
): Promise<boolean> => {
  const redis = getRedisConnection();
  const contentKey = content.slice(0, 30).replace(/\s+/g, '');
  const lockKey = `write_lock:comment:${cafeId}:${articleId}:${accountId}:${contentKey}`;
  const result = await redis.set(lockKey, '1', 'EX', WRITE_LOCK_TTL, 'NX');
  return result === 'OK';
};

export interface CommentHandlerContext {
  account: NaverAccount;
  settings: {
    timeout: number;
  };
}

export const handleCommentJob = async (
  data: CommentJobData,
  ctx: CommentHandlerContext
): Promise<JobResult> => {
  const { account, settings } = ctx;
  const hasSequence = Boolean(data.sequenceId && data.sequenceIndex !== undefined);

  if (hasSequence) {
    const turn = await waitForSequenceTurn(data.sequenceId!, data.sequenceIndex!);
    if (turn === 'skipped') {
      return { success: true };
    }
    if (turn === 'pending') {
      const retryDelay = SEQUENCE_WAIT_RETRY_MS;
      console.log(`[WORKER] 순서 대기 - ${retryDelay / 1000}초 뒤 재스케줄: ${data.sequenceId}#${data.sequenceIndex}`);
      await addTaskJob(
        data.accountId,
        { ...data, rescheduleToken: `seqwait_${Date.now().toString(36)}` },
        retryDelay
      );
      return {
        success: false,
        error: '순서 대기 - 재스케줄됨',
        willRetry: true,
      };
    }
  }

  const advanceIfNeeded = async (): Promise<void> => {
    if (hasSequence) {
      await advanceSequence(data.sequenceId!);
    }
  };

  const rescheduleCurrentTurn = async (
    delayMs: number,
    retryCount: number = data._retryCount ?? 0
  ): Promise<void> => {
    await addTaskJob(
      data.accountId,
      {
        ...data,
        _retryCount: retryCount + 1,
        rescheduleToken: createRescheduleToken(),
      },
      delayMs
    );
  };

  // articleId가 0이고 keyword가 있으면 DB에서 조회 (viral batch)
  let articleId = data.articleId;
  if (articleId === 0 && data.keyword) {
    const keyword = data.keyword.trim();
    console.log(`[WORKER] 글 조회 시도: cafeId=${data.cafeId}, keyword="${keyword}"`);

    const foundId = await getArticleIdByKeyword(data.cafeId, keyword);
    if (!foundId) {
      const retryCount = data._retryCount ?? 0;
      if (retryCount >= MAX_TRANSIENT_RETRY) {
        console.error(`[WORKER] 글 조회 실패 (최대 재시도 초과): ${keyword}`);
        await advanceIfNeeded();
        return { success: false, error: '글 조회 실패 - 최대 재시도 초과' };
      }

      console.log(`[WORKER] 글 미발행 - 2분 뒤 현재 순서 재시도 (${retryCount + 1}/${MAX_TRANSIENT_RETRY}): ${keyword}`);
      await rescheduleCurrentTurn(ARTICLE_LOOKUP_RETRY_MS, retryCount);
      return {
        success: false,
        error: '글 미발행 - 재스케줄됨',
        willRetry: true,
      };
    }
    articleId = foundId;
    console.log(`[WORKER] 글 조회 성공: articleId=${articleId}`);
  }

  if (articleId === 0) {
    console.error(`[WORKER] articleId가 0 - keyword 없음, 댓글 스킵`);
    await advanceIfNeeded();
    return { success: false, error: 'articleId가 0이고 keyword도 없음' };
  }

  // 중복 체크: 이미 이 계정으로 댓글 달았으면 스킵
  const alreadyCommented = await hasCommented(data.cafeId, articleId, account.id, 'comment');
  if (alreadyCommented) {
    console.log(`[WORKER] 중복 댓글 스킵: ${account.id} → #${articleId}`);
    await advanceIfNeeded();
    return { success: true };
  }

  // Redis 락: 동일 댓글 동시 실행 방지 (stalled job 재실행 / retry 중복 차단)
  const lockAcquired = await acquireWriteLock(data.cafeId, articleId, account.id, data.content);
  if (!lockAcquired) {
    const retryCount = data._retryCount ?? 0;
    console.log(`[WORKER] 댓글 작성 락 중복 - 재시도 예정: ${account.id} → #${articleId}`);
    if (retryCount >= MAX_TRANSIENT_RETRY) {
      await advanceIfNeeded();
      return { success: false, error: '댓글 작성 락 중복 - 재시도 초과' };
    }

    await rescheduleCurrentTurn(WRITE_LOCK_RETRY_MS, retryCount);
    return { success: false, error: '댓글 작성 락 중복 - BullMQ retry 대기' };
  }

  log.info('댓글 작성 시도', { accountId: account.id, articleId, cafeId: data.cafeId, keyword: data.keyword });

  const result = await Promise.race([
    writeCommentWithAccount(account, data.cafeId, articleId, data.content),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('타임아웃')), settings.timeout)
    ),
  ]);

  // ARTICLE_NOT_READY 에러: 5분 뒤 재시도 (시퀀스 없이)
  if (!result.success && result.error?.startsWith('ARTICLE_NOT_READY:')) {
    const retryCount = data._retryCount ?? 0;
    if (retryCount >= MAX_TRANSIENT_RETRY) {
      log.warn('글 미준비 재시도 초과 — 현재 순서 포기', { accountId: account.id, articleId, error: result.error });
      await advanceIfNeeded();
      return { success: false, error: result.error };
    }

    log.warn('글 미준비 — 5분 뒤 재시도', { accountId: account.id, articleId, error: result.error });
    await rescheduleCurrentTurn(ARTICLE_NOT_READY_RETRY_MS, retryCount);
    return { success: false, error: result.error, willRetry: true };
  }

  if (!result.success) {
    const retryCount = data._retryCount ?? 0;
    log.error('댓글 작성 실패 — 1분 뒤 재시도', { accountId: account.id, articleId, error: result.error });
    invalidateLoginCache(account.id);

    if (retryCount >= MAX_TRANSIENT_RETRY) {
      await advanceIfNeeded();
      return { success: false, error: result.error || '댓글 작성 실패' };
    }

    await rescheduleCurrentTurn(WRITE_FAIL_RETRY_MS, retryCount);
    return { success: false, error: result.error || '댓글 작성 실패', willRetry: true };
  }

  log.info('댓글 작성 성공', { accountId: account.id, articleId, commentId: result.commentId });

  // DB에 댓글 기록 저장
  try {
    await addCommentToArticle(data.cafeId, articleId, {
      accountId: account.id,
      nickname: account.nickname || account.id,
      content: data.content,
      type: 'comment',
      commentId: result.commentId,
      commentIndex: data.commentIndex,
      sequenceId: data.sequenceId,
    });
  } catch (dbErr) {
    log.error('댓글 DB 저장 실패', { accountId: account.id, articleId, error: String(dbErr) });
  }

  await advanceIfNeeded();
  return { success: true };
};
