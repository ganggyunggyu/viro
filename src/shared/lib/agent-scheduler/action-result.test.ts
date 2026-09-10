import assert from 'node:assert/strict';
import test from 'node:test';
import { runSchedulerTask, type SchedulerTaskDependencies } from './task-service';
import { processActionTask } from '../../../../agent/lib/action-runner';
import type { SchedulerTask } from './task-contract';

const executeFixture = async (error: string, requiresReview = false) => {
  const ref = { kind: 'action' as const, id: 'a'.repeat(64), dispatchId: 'd'.repeat(64) };
  const action = { type: 'account-login' as const, accountId: 'owned' };
  const leaseId = '11111111-1111-4111-8111-111111111111';
  const row: SchedulerTask = { ...ref, userId: 'owner', status: 'running', action, claimedBy: `scheduler:worker:${leaseId}`, claimedAt: new Date() };
  const dependencies: SchedulerTaskDependencies = {
    store: {
      find: async () => row, claim: async () => null, expire: async () => {}, renew: async () => true,
      finish: async (_, __, ___, status, result) => { row.status = status as SchedulerTask['status']; row.result = result; return true; },
    }, context: async () => ({ accounts: [], cafes: [] }), sync: async () => ({}), prepare: async () => ({}),
  };
  await processActionTask(action, {
    heartbeat: async () => true,
    execute: async () => ({ success: false, error, requiresReview }),
    report: async (result, uncertain) => {
      await runSchedulerTask(dependencies, ref, 'result', { dispatchId: ref.dispatchId, workerId: 'worker', leaseId, result, uncertain });
      return true;
    },
  });
  return row;
};

test('scheduler keeps account failure codes and status through worker and server sanitization', async () => {
  const row = await executeFixture('캡차 풀이 실패: private-password');
  assert.equal(row.status, 'failed');
  assert.equal((row.result as { errorCode: string }).errorCode, 'captcha_required');
  assert.doesNotMatch(JSON.stringify(row.result), /private-password/);
});

test('explicit account uncertainty remains needs_review despite a nested login error', async () => {
  const row = await executeFixture('로그인 실패: private-cookie', true);
  assert.equal(row.status, 'needs_review');
  assert.equal((row.result as { errorCode: string }).errorCode, 'result_unverified');
  assert.doesNotMatch(JSON.stringify(row.result), /private-cookie/);
});
