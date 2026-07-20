'use server';

import { Queue, Job } from 'bullmq';
import type { AccountQueueStatus, QueueOverview, QueueTotals } from '../model';
import { getRedisConnection } from '@/shared/lib/redis';
import { getAllAccounts } from '@/shared/config/accounts';
import { getTaskQueueName, TaskJobData, type JobResult } from '@/shared/lib/queue/types';
import { getAllCafes } from '@/shared/config/cafes';
import {
  aggregateQueueEntries,
  createEmptyQueueCounts,
  resolveQueueJobStatus,
  type LogicalQueueStatus,
  type PhysicalQueueStatus,
  type QueueRetentionReport,
} from '@/shared/lib/queue/status-harness';

export type AllQueueStatus = QueueOverview;

export interface JobDetail {
  id: string;
  accountId: string;
  type: 'post' | 'comment' | 'reply' | 'like' | 'disable-comment';
  cafeId: string;
  cafeName?: string;
  status: LogicalQueueStatus;
  subject?: string;
  keyword?: string;
  content?: string;
  articleId?: number;
  commentIndex?: number;
  delay?: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  createdAt: number;
}

export interface JobsPage {
  jobs: JobDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  retention: QueueRetentionReport;
}

export interface JobsFilter {
  status?: LogicalQueueStatus | 'all';
  type?: 'post' | 'comment' | 'reply' | 'like' | 'disable-comment' | 'all';
  accountId?: string;
  cafeId?: string;
}

export interface QueueSummary {
  total: QueueTotals;
  byType: Record<TaskJobData['type'], QueueTotals>;
  byCafe: { cafeId: string; cafeName: string; count: number }[];
  byAccount: { accountId: string; count: number }[];
  retention: QueueRetentionReport;
}

const TASK_JOB_STATUSES = ['delayed', 'waiting', 'active', 'completed', 'failed'] as const;

const createTaskQueue = () =>
  new Queue<TaskJobData, JobResult>(getTaskQueueName(), { connection: getRedisConnection() });

const getJobsForStatuses = async (
  queue: Queue<TaskJobData, JobResult>,
): Promise<Array<{ job: Job<TaskJobData, JobResult>; status: PhysicalQueueStatus }>> => {
  const jobsByStatus = await Promise.all(
    TASK_JOB_STATUSES.map(async (status) => {
      const limit = status === 'active' ? 100 : 10000;
      const jobs = await queue.getJobs([status], 0, limit);
      return jobs.map((job) => ({ job, status }));
    })
  );

  return jobsByStatus.flat();
};

export const getAllQueueStatus = async (): Promise<AllQueueStatus> => {
  const accounts = await getAllAccounts();
  const queueName = getTaskQueueName();
  const queue = createTaskQueue();
  let aggregate = aggregateQueueEntries({ accountIds: accounts.map(({ id }) => id), entries: [] });

  try {
    const entries = await getJobsForStatuses(queue);
    aggregate = aggregateQueueEntries({
      accountIds: accounts.map(({ id }) => id),
      entries: entries.map(({ job: { data, returnvalue }, status }) => ({
        accountId: data.accountId,
        result: returnvalue,
        status,
      })),
    });
  } catch (error) {
    console.error('[QUEUE] 글로벌 큐 상태 조회 실패:', error);
  } finally {
    await queue.close();
  }

  const queues: AccountQueueStatus[] = accounts.map(({ id }) => ({
    accountId: id,
    queueName,
    ...(aggregate.byAccount.get(id) ?? createEmptyQueueCounts()),
  }));

  return { queues, retention: aggregate.retention, total: aggregate.total };
};

export const clearAccountQueue = async (accountId: string): Promise<{ success: boolean; message: string }> => {
  const queue = createTaskQueue();

  try {
    const jobs = await getJobsForStatuses(queue);
    const targetJobs = jobs.filter(({ job, status }) => job.data.accountId === accountId && status !== 'active');

    await Promise.all(targetJobs.map(({ job }) => job.remove()));

    const activeCount = jobs.filter(
      ({ job, status }) => job.data.accountId === accountId && status === 'active'
    ).length;

    const activeMessage = activeCount > 0 ? `, 진행 중 ${activeCount}개 제외` : '';
    return { success: true, message: `${accountId} 큐 ${targetJobs.length}개 클리어 완료${activeMessage}` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  } finally {
    await queue.close();
  }
};

export const clearAllQueues = async (): Promise<{ success: boolean; message: string }> => {
  const queue = createTaskQueue();

  try {
    await queue.obliterate({ force: true });
    return { success: true, message: '글로벌 큐 클리어 완료' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  } finally {
    await queue.close();
  }
};

const jobToDetail = (
  job: Job<TaskJobData, JobResult>,
  status: PhysicalQueueStatus,
  cafeMap: Map<string, string>
): JobDetail => {
  const data = job.data;
  const now = Date.now();

  const detail: JobDetail = {
    id: job.id || '',
    accountId: data.accountId,
    type: data.type,
    cafeId: data.cafeId,
    cafeName: cafeMap.get(data.cafeId),
    status: resolveQueueJobStatus(status, job.returnvalue),
    createdAt: job.timestamp || now,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
  };

  if (data.type === 'post') {
    detail.subject = data.subject;
    detail.keyword = data.keyword;
  } else if (data.type === 'comment' || data.type === 'reply') {
    detail.articleId = data.articleId;
    detail.content = data.content;
    if (data.type === 'reply') {
      detail.commentIndex = data.commentIndex;
    }
  } else {
    detail.articleId = data.articleId;
  }

  if (detail.status === 'delayed' && job.delay) {
    const scheduledTime = (job.timestamp || now) + job.delay;
    detail.delay = Math.max(0, scheduledTime - now);
  }

  return detail;
};

export const getDetailedJobs = async (
  filter: JobsFilter = {},
  page: number = 1,
  pageSize: number = 20
): Promise<JobsPage> => {
  const accounts = await getAllAccounts();
  const cafes = await getAllCafes();
  const cafeMap = new Map(cafes.map((c) => [c.cafeId, c.name]));

  const targetAccounts = filter.accountId
    ? accounts.filter((a) => a.id === filter.accountId)
    : accounts;
  const targetAccountIds = new Set(targetAccounts.map(({ id }) => id));

  const allJobs: JobDetail[] = [];
  const queue = createTaskQueue();
  let retention = aggregateQueueEntries({ accountIds: [], entries: [] }).retention;

  try {
    const entries = await getJobsForStatuses(queue);
    retention = aggregateQueueEntries({
      accountIds: Array.from(targetAccountIds),
      entries: entries.map(({ job: { data, returnvalue }, status }) => ({
        accountId: data.accountId,
        result: returnvalue,
        status,
      })),
    }).retention;
    for (const { job, status } of entries) {
      if (!targetAccountIds.has(job.data.accountId)) continue;
      allJobs.push(jobToDetail(job, status, cafeMap));
    }
  } catch (error) {
    console.error('[QUEUE] 글로벌 큐 jobs 조회 실패:', error);
  } finally {
    await queue.close();
  }

  let filtered = allJobs;
  if (filter.status && filter.status !== 'all') {
    filtered = filtered.filter(({ status }) => status === filter.status);
  }
  if (filter.type && filter.type !== 'all') {
    filtered = filtered.filter((j) => j.type === filter.type);
  }
  if (filter.cafeId) {
    filtered = filtered.filter((j) => j.cafeId === filter.cafeId);
  }

  const statusOrder: Record<LogicalQueueStatus, number> = {
    active: 0,
    delayed: 1,
    waiting: 2,
    requeued: 3,
    softFailed: 4,
    skipped: 5,
    completed: 6,
    failed: 7,
  };
  filtered.sort((a, b) => {
    const orderDiff = statusOrder[a.status] - statusOrder[b.status];
    if (orderDiff !== 0) return orderDiff;
    if (a.status === 'delayed' && b.status === 'delayed') {
      return (a.delay || 0) - (b.delay || 0);
    }
    return b.createdAt - a.createdAt;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const jobs = filtered.slice(start, start + pageSize);

  return { jobs, total, page, pageSize, totalPages, retention };
};

export const getQueueSummary = async (): Promise<QueueSummary> => {
  const { jobs, retention } = await getDetailedJobs({}, 1, 10000);
  const cafes = await getAllCafes();
  const cafeMap = new Map(cafes.map((c) => [c.cafeId, c.name]));

  const summary: QueueSummary = {
    total: createEmptyQueueCounts(),
    byType: {
      post: createEmptyQueueCounts(),
      comment: createEmptyQueueCounts(),
      reply: createEmptyQueueCounts(),
      like: createEmptyQueueCounts(),
      'disable-comment': createEmptyQueueCounts(),
    },
    byCafe: [],
    byAccount: [],
    retention,
  };

  const cafeCount = new Map<string, number>();
  const accountCount = new Map<string, number>();

  for (const job of jobs) {
    summary.total[job.status]++;
    summary.byType[job.type][job.status]++;
    if (job.status === 'softFailed') {
      summary.total.failed++;
      summary.byType[job.type].failed++;
    }

    if (['delayed', 'waiting', 'active'].includes(job.status)) {
      cafeCount.set(job.cafeId, (cafeCount.get(job.cafeId) || 0) + 1);
      accountCount.set(job.accountId, (accountCount.get(job.accountId) || 0) + 1);
    }
  }

  summary.byCafe = Array.from(cafeCount.entries())
    .map(([cafeId, count]) => ({
      cafeId,
      cafeName: cafeMap.get(cafeId) || cafeId,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  summary.byAccount = Array.from(accountCount.entries())
    .map(([accountId, count]) => ({ accountId, count }))
    .sort((a, b) => b.count - a.count);

  return summary;
};

export const removeJob = async (
  accountId: string,
  jobId: string
): Promise<{ success: boolean; message: string }> => {
  const queue = createTaskQueue();

  try {
    const job = await queue.getJob(jobId);
    if (!job) {
      return { success: false, message: '작업을 찾을 수 없음' };
    }

    if (job.data.accountId !== accountId) {
      return { success: false, message: '계정과 작업이 일치하지 않음' };
    }

    const state = await job.getState();
    if (state === 'active') {
      return { success: false, message: '진행 중인 작업은 삭제할 수 없음' };
    }

    await job.remove();
    return { success: true, message: '작업 삭제 완료' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  } finally {
    await queue.close();
  }
};

export const getRelatedJobs = async (articleId: number): Promise<JobDetail[]> => {
  const cafes = await getAllCafes();
  const cafeMap = new Map(cafes.map((c) => [c.cafeId, c.name]));
  const relatedJobs: JobDetail[] = [];
  const queue = createTaskQueue();

  try {
    const entries = await getJobsForStatuses(queue);
    for (const { job, status } of entries) {
      if (job.data.type !== 'post' && job.data.articleId === articleId) {
        relatedJobs.push(jobToDetail(job, status, cafeMap));
      }
    }
  } catch (error) {
    console.error('[QUEUE] 글로벌 큐 연관 작업 조회 실패:', error);
  } finally {
    await queue.close();
  }

  const statusOrder: Record<LogicalQueueStatus, number> = {
    active: 0,
    delayed: 1,
    waiting: 2,
    requeued: 3,
    softFailed: 4,
    skipped: 5,
    completed: 6,
    failed: 7,
  };
  relatedJobs.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return relatedJobs;
};
