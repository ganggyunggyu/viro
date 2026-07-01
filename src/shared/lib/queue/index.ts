import { Queue, Job } from 'bullmq';
import { getRedisConnection } from '../redis';
import {
  TaskJobData,
  GenerateJobData,
  JobResult,
  getTaskQueueName,
  GENERATE_QUEUE_NAME,
} from './types';
import { getQueueSettings, getRandomDelay } from '@/shared/models/queue-settings';
import {
  createAddTaskJob,
  createRescheduleToken,
  generateTaskJobId,
  resolveTaskJobDelay,
} from './task-job-harness';

let taskQueue: Queue<TaskJobData, JobResult> | null = null;
let generateQueue: Queue<GenerateJobData, JobResult> | null = null;

export const getTaskQueue = (accountId: string): Queue<TaskJobData, JobResult> => {
  void accountId;
  const queueName = getTaskQueueName();

  if (!taskQueue) {
    taskQueue = new Queue<TaskJobData, JobResult>(queueName, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    console.log(`[QUEUE] 글로벌 Task 큐 생성: ${queueName}`);
  }

  return taskQueue;
};

export const getGenerateQueue = (): Queue<GenerateJobData, JobResult> => {
  if (!generateQueue) {
    generateQueue = new Queue<GenerateJobData, JobResult>(GENERATE_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 3000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    console.log(`[QUEUE] Generate 큐 생성`);
  }

  return generateQueue;
};

export const addTaskJob = createAddTaskJob<Job<TaskJobData, JobResult>>({
  getQueueSettings,
  getRandomDelay,
  getTaskQueue,
  log: (message: string) => console.log(message),
});

export const addGenerateJob = async (
  data: GenerateJobData
): Promise<Job<GenerateJobData, JobResult>> => {
  const queue = getGenerateQueue();

  const job = await queue.add('generate', data, {
    jobId: `generate_${data.keyword}_${Date.now()}`,
  });

  console.log(`[QUEUE] Generate Job 추가: ${data.keyword}`);
  return job;
};

export const closeAllQueues = async (): Promise<void> => {
  if (taskQueue) {
    await taskQueue.close();
    taskQueue = null;
    console.log(`[QUEUE] 글로벌 Task 큐 종료`);
  }

  if (generateQueue) {
    await generateQueue.close();
    generateQueue = null;
    console.log(`[QUEUE] Generate 큐 종료`);
  }
};

export const getQueueStatus = async (accountId: string) => {
  const queue = getTaskQueue(accountId);
  const [waitingJobs, activeJobs, completedJobs, failedJobs, delayedJobs] = await Promise.all([
    queue.getWaiting(0, 10000),
    queue.getActive(0, 10000),
    queue.getCompleted(0, 10000),
    queue.getFailed(0, 10000),
    queue.getDelayed(0, 10000),
  ]);

  const countByAccount = (jobs: Array<Job<TaskJobData, JobResult>>) =>
    jobs.filter((job) => job.data.accountId === accountId).length;

  return {
    waiting: countByAccount(waitingJobs),
    active: countByAccount(activeJobs),
    completed: countByAccount(completedJobs),
    failed: countByAccount(failedJobs),
    delayed: countByAccount(delayedJobs),
  };
};

export const getActiveQueueIds = (): string[] => {
  return taskQueue ? [getTaskQueueName()] : [];
};

export { startAllTaskWorkers } from './workers';
export { createRescheduleToken, generateTaskJobId, resolveTaskJobDelay };
