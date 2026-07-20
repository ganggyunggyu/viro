import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../redis';
import {
  TaskJobData,
  GenerateJobData,
  JobResult,
  getTaskQueueName,
  GENERATE_QUEUE_NAME,
  PostJobData,
  CommentJobData,
  ReplyJobData,
  LikeJobData,
  DisableCommentJobData,
  TASK_QUEUE_NAME,
} from './types';
import { addTaskJob, createRescheduleToken } from './index';
import { getAccountById, getAllAccounts } from '@/shared/config/accounts';
import { isAccountActive, getNextActiveTime } from '@/shared/lib/account-manager';
import {
  isAccountLoggedIn,
  loginAccount,
  releaseAccountSession,
  saveCookiesForAccount,
} from '@/shared/lib/multi-session';
import { getQueueSettings } from '@/shared/models/queue-settings';
import { handlePostJob } from './handlers/post-handler';
import { handleCommentJob } from './handlers/comment-handler';
import { handleReplyJob } from './handlers/reply-handler';
import { handleLikeJob } from './handlers/like-handler';
import { handleDisableCommentJob } from './handlers/disable-comment-handler';

declare global {
  var __taskWorker: Worker<TaskJobData, JobResult> | null | undefined;
  var __generateWorker: Worker<GenerateJobData, JobResult> | null | undefined;
}

let taskWorker: Worker<TaskJobData, JobResult> | null =
  globalThis.__taskWorker ?? null;
let generateWorker: Worker<GenerateJobData, JobResult> | null =
  globalThis.__generateWorker ?? null;

const WORKER_LOCK_DURATION = 10 * 60 * 1000;
const WORKER_LOCK_RENEW_TIME = 30 * 1000;
const WORKER_STALLED_INTERVAL = 2 * 60 * 1000;
const WORKER_MAX_STALLED_COUNT = 3;
const TASK_WORKER_CONCURRENCY = Math.max(1, Number(process.env.TASK_WORKER_CONCURRENCY || '1'));

const syncAccountSessionReservation = async (accountId: string): Promise<void> => {
  const { waiting, delayed = 0, active } = await import('./index').then(({ getQueueStatus }) =>
    getQueueStatus(accountId)
  );

  if (waiting + delayed + active > 0) {
    console.log(
      `[SESSION] ${accountId} 예약 세션 유지 (waiting=${waiting}, delayed=${delayed}, active=${active})`
    );
    return;
  }

  await saveCookiesForAccount(accountId);
  releaseAccountSession(accountId);
};

export const processTaskJob = async (
  job: Job<TaskJobData, JobResult>
): Promise<JobResult> => {
  const { data } = job;

  const settings = await getQueueSettings();

  console.log(`[WORKER] 처리 시작: ${data.type} (${data.accountId})`);

  let accounts: Awaited<ReturnType<typeof getAllAccounts>> = [];
  let account: Awaited<ReturnType<typeof getAccountById>> | undefined;

  if (data.userId) {
    accounts = await getAllAccounts(data.userId);
    account = accounts.find((a) => a.id === data.accountId);
  }

  if (!account) {
    account = (await getAccountById(data.accountId)) ?? undefined;
    if (account) {
      accounts = [account, ...accounts.filter((a) => a.id !== account?.id)];
    }
  }

  if (!account) {
    return { success: false, error: `계정 없음: ${data.accountId}` };
  }

  if (!isAccountActive(account)) {
    const nextActiveDelay = getNextActiveTime(account);
    console.log(
      `[WORKER] 비활동 시간 - ${Math.round(
        nextActiveDelay / 60000
      )}분 뒤 재스케줄: ${data.accountId}`
    );
    await addTaskJob(
      data.accountId,
      { ...data, rescheduleToken: createRescheduleToken() },
      nextActiveDelay
    );
    return {
      success: false,
      error: '비활동 시간대 - 재스케줄됨',
      willRetry: true,
    };
  }

  const loggedIn = await isAccountLoggedIn(account.id);
  if (!loggedIn) {
    console.log(`[WORKER] 로그인 필요 — 로그인 시도: ${account.id}`);
    const loginResult = await loginAccount(account.id, account.password);
    if (!loginResult.success) {
      throw new Error(`로그인 실패: ${loginResult.error}`);
    }
    console.log(`[WORKER] 로그인 완료: ${account.id}`);
  }

  switch (data.type) {
    case 'post':
      return handlePostJob(data as PostJobData, { account, accounts, settings });

    case 'comment':
      return handleCommentJob(data as CommentJobData, { account, settings });

    case 'reply':
      return handleReplyJob(data as ReplyJobData, { account, settings });

    case 'like':
      return handleLikeJob(data as LikeJobData, { account, settings });

    case 'disable-comment':
      return handleDisableCommentJob(data as DisableCommentJobData, { account });

    default:
      throw new Error('알 수 없는 작업 타입');
  }
};

export const createTaskWorker = (): Worker<TaskJobData, JobResult> => {
  const queueName = getTaskQueueName();

  if (taskWorker) {
    return taskWorker;
  }

  const worker = new Worker<TaskJobData, JobResult>(queueName, processTaskJob, {
    connection: getRedisConnection(),
    concurrency: TASK_WORKER_CONCURRENCY,
    lockDuration: WORKER_LOCK_DURATION,
    lockRenewTime: WORKER_LOCK_RENEW_TIME,
    stalledInterval: WORKER_STALLED_INTERVAL,
    maxStalledCount: WORKER_MAX_STALLED_COUNT,
  });

  worker.on('completed', (job, result) => {
    console.log(
      `[WORKER] 완료: ${job.name} (${job.data.accountId})`,
      result.success ? '성공' : '실패'
    );
    syncAccountSessionReservation(job.data.accountId).catch(e =>
      console.error(`[WORKER] 세션 동기화 에러 (완료): ${job.data.accountId}`, e)
    );
  });

  worker.on('failed', (job, err) => {
    const accountId = job?.data.accountId ?? 'unknown';
    console.error(`[WORKER] 실패: ${job?.name} (${accountId})`, err.message);
    syncAccountSessionReservation(accountId).catch(e =>
      console.error(`[WORKER] 세션 동기화 에러 (실패): ${accountId}`, e)
    );
  });

  taskWorker = worker;
  globalThis.__taskWorker = worker;
  console.log(`[WORKER] 글로벌 Task 워커 생성: ${TASK_QUEUE_NAME} (concurrency=${TASK_WORKER_CONCURRENCY})`);

  return worker;
};

export const createGenerateWorker = (
  processGenerate: (job: Job<GenerateJobData>) => Promise<JobResult>
): Worker<GenerateJobData, JobResult> => {
  if (generateWorker) {
    return generateWorker;
  }

  generateWorker = new Worker<GenerateJobData, JobResult>(
    GENERATE_QUEUE_NAME,
    processGenerate,
    {
      connection: getRedisConnection(),
      concurrency: 3,
      lockDuration: WORKER_LOCK_DURATION,
      lockRenewTime: WORKER_LOCK_RENEW_TIME,
      stalledInterval: WORKER_STALLED_INTERVAL,
      maxStalledCount: WORKER_MAX_STALLED_COUNT,
    }
  );
  globalThis.__generateWorker = generateWorker;

  generateWorker.on('completed', (job, result) => {
    console.log(
      `[WORKER] Generate 완료: ${job.data.keyword}`,
      result.success ? '성공' : '실패'
    );
  });

  generateWorker.on('failed', (job, err) => {
    console.error(`[WORKER] Generate 실패: ${job?.data.keyword}`, err.message);
  });

  console.log('[WORKER] Generate 워커 생성');

  return generateWorker;
};

export const closeAllWorkers = async (): Promise<void> => {
  if (taskWorker) {
    await taskWorker.close();
    taskWorker = null;
    globalThis.__taskWorker = null;
    console.log('[WORKER] 글로벌 Task 워커 종료');
  }

  if (generateWorker) {
    await generateWorker.close();
    generateWorker = null;
    globalThis.__generateWorker = null;
    console.log('[WORKER] Generate 워커 종료');
  }
};

// Vercel 서버리스에는 Playwright 크롬 바이너리가 없고 상시 프로세스도 아니라,
// 여기서 인라인 워커를 켜면 잡 처리 중 브라우저 실행이 터진다(서버 예외).
// 컨트롤플레인(Vercel)은 큐 적재만 하고, 실제 소비는 로컬/원격 에이전트가 담당한다.
// WORKER_INLINE=1 로 강제 실행은 가능(로컬 pm2·에이전트는 VERCEL 미설정이라 그대로 켜짐).
const shouldStartInlineWorker = (): boolean =>
  !process.env.VERCEL || process.env.WORKER_INLINE === '1';

export const startAllTaskWorkers = async (): Promise<void> => {
  if (!shouldStartInlineWorker()) {
    console.log('[WORKER] Vercel 컨트롤플레인 감지 - 인라인 워커 생략(적재 전용)');
    return;
  }

  const accounts = await getAllAccounts();

  createTaskWorker();

  console.log(`[WORKER] 글로벌 워커 시작됨 (${accounts.length}개 계정 대상)`);
};
