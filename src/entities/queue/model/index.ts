import type { QueueCounts, QueueRetentionReport } from '@/shared/lib/queue/status-harness';

export interface QueueState {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed?: number;
  requeued?: number;
  softFailed?: number;
  skipped?: number;
}

export type QueueStatusMap = Record<string, QueueState>;

export type QueueTotals = QueueCounts;

export interface AccountQueueStatus extends QueueTotals {
  accountId: string;
  queueName: string;
}

export interface QueueOverview {
  queues: AccountQueueStatus[];
  total: QueueTotals;
  retention: QueueRetentionReport;
}

export type QueueStatusResult = QueueStatusMap;
