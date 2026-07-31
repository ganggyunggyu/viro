import { resolveJobOutcome } from './job-outcome-harness';
import type { JobResult } from './types';

export type PhysicalQueueStatus = 'waiting' | 'active' | 'delayed' | 'completed' | 'failed';
export type LogicalQueueStatus = PhysicalQueueStatus | 'requeued' | 'softFailed' | 'skipped';

export interface QueueCounts {
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  requeued: number;
  softFailed: number;
  skipped: number;
}

export interface QueueStatusEntry {
  accountId: string;
  status: PhysicalQueueStatus;
  result?: JobResult;
}

export interface QueueRetentionLimit {
  limit: number;
  retained: number;
  mayBeTruncated: boolean;
}

export interface QueueRetentionReport {
  completed: QueueRetentionLimit;
  failed: QueueRetentionLimit;
}

export const DEFAULT_QUEUE_RETENTION_LIMITS = {
  completed: 100,
  failed: 50,
} as const;

export const createEmptyQueueCounts = (): QueueCounts => ({
  waiting: 0,
  active: 0,
  delayed: 0,
  completed: 0,
  failed: 0,
  requeued: 0,
  softFailed: 0,
  skipped: 0,
});

export const resolveQueueJobStatus = (
  status: PhysicalQueueStatus,
  result?: JobResult,
): LogicalQueueStatus => {
  if (status !== 'completed') return status;

  const outcome = resolveJobOutcome(result ?? { success: true });
  if (outcome === 'soft-failed') return 'softFailed';
  return outcome;
};

const incrementQueueCount = (counts: QueueCounts, status: LogicalQueueStatus): void => {
  counts[status] += 1;
  if (status === 'softFailed') counts.failed += 1;
};

const buildRetentionLimit = (limit: number, retained: number): QueueRetentionLimit => ({
  limit,
  retained,
  mayBeTruncated: retained >= limit,
});

export const aggregateQueueEntries = ({
  accountIds,
  entries,
  retentionLimits = DEFAULT_QUEUE_RETENTION_LIMITS,
}: {
  accountIds: string[];
  entries: QueueStatusEntry[];
  retentionLimits?: { completed: number; failed: number };
}) => {
  const byAccount = new Map(accountIds.map((accountId) => [accountId, createEmptyQueueCounts()]));
  const total = createEmptyQueueCounts();

  for (const { accountId, result, status } of entries) {
    const logicalStatus = resolveQueueJobStatus(status, result);
    const accountCounts = byAccount.get(accountId) ?? createEmptyQueueCounts();
    incrementQueueCount(accountCounts, logicalStatus);
    incrementQueueCount(total, logicalStatus);
    byAccount.set(accountId, accountCounts);
  }

  const retainedCompleted = entries.filter(({ status }) => status === 'completed').length;
  const retainedFailed = entries.filter(({ status }) => status === 'failed').length;

  return {
    byAccount,
    retention: {
      completed: buildRetentionLimit(retentionLimits.completed, retainedCompleted),
      failed: buildRetentionLimit(retentionLimits.failed, retainedFailed),
    },
    total,
  };
};
