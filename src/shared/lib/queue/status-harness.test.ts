import assert from 'node:assert/strict';
import test from 'node:test';

import { annotateJobResult } from './job-outcome-harness';
import {
  aggregateQueueEntries,
  DEFAULT_QUEUE_RETENTION_LIMITS,
} from './status-harness';

test('completed BullMQ jobs with soft failures are counted as failures', () => {
  const result = annotateJobResult({ success: false, error: '계정 없음' });
  const aggregate = aggregateQueueEntries({
    accountIds: ['account-a'],
    entries: [{ accountId: 'account-a', status: 'completed', result }],
  });

  assert.equal(result.outcome, 'soft-failed');
  assert.equal(result.softFailed, true);
  assert.equal(aggregate.total.completed, 0);
  assert.equal(aggregate.total.failed, 1);
  assert.equal(aggregate.total.softFailed, 1);
});

test('requeued and skipped results stay distinct from completed jobs', () => {
  const requeuedResult = annotateJobResult({ success: false, willRetry: true });
  const aggregate = aggregateQueueEntries({
    accountIds: ['account-a'],
    entries: [
      {
        accountId: 'account-a',
        status: 'completed',
        result: requeuedResult,
      },
      {
        accountId: 'account-a',
        status: 'completed',
        result: annotateJobResult({ success: true, skipped: true }),
      },
      {
        accountId: 'account-a',
        status: 'completed',
        result: annotateJobResult({ success: true }),
      },
    ],
  });

  assert.equal(requeuedResult.outcome, 'requeued');
  assert.equal(requeuedResult.requeued, true);
  assert.equal(aggregate.total.requeued, 1);
  assert.equal(aggregate.total.skipped, 1);
  assert.equal(aggregate.total.completed, 1);
});

test('queue entries are counted per account from the global queue', () => {
  const aggregate = aggregateQueueEntries({
    accountIds: ['account-a', 'account-b'],
    entries: [
      { accountId: 'account-a', status: 'waiting' },
      { accountId: 'account-a', status: 'completed', result: { success: true } },
      { accountId: 'account-b', status: 'failed' },
    ],
  });

  assert.equal(aggregate.byAccount.get('account-a')?.waiting, 1);
  assert.equal(aggregate.byAccount.get('account-a')?.completed, 1);
  assert.equal(aggregate.byAccount.get('account-a')?.failed, 0);
  assert.equal(aggregate.byAccount.get('account-b')?.failed, 1);
});

test('retention caps surface completed and failed counts as lower bounds', () => {
  const completedEntries = Array.from(
    { length: DEFAULT_QUEUE_RETENTION_LIMITS.completed },
    () => ({ accountId: 'account-a', status: 'completed' as const }),
  );
  const failedEntries = Array.from(
    { length: DEFAULT_QUEUE_RETENTION_LIMITS.failed },
    () => ({ accountId: 'account-b', status: 'failed' as const }),
  );
  const aggregate = aggregateQueueEntries({
    accountIds: ['account-a', 'account-b'],
    entries: [...completedEntries, ...failedEntries],
  });

  assert.equal(aggregate.retention.completed.mayBeTruncated, true);
  assert.equal(aggregate.retention.failed.mayBeTruncated, true);
  assert.equal(aggregate.retention.completed.retained, DEFAULT_QUEUE_RETENTION_LIMITS.completed);
  assert.equal(aggregate.retention.failed.retained, DEFAULT_QUEUE_RETENTION_LIMITS.failed);
});
