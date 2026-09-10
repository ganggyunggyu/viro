import assert from 'node:assert/strict';
import { dispatchDesktopAction } from '../agent/lib/desktop-action-dispatch';

const run = async () => {
  let executions = 0;
  const failed = async () => { executions += 1; return { success: false, completed: 1, failed: 2 }; };
  const executors = {
    'account-login': failed, 'cafe-join-all': failed, 'nickname-change': failed,
    'exposure-check': failed, 'cafe-create': failed, 'manual-publish': failed,
    'manual-modify': failed, rewrite: failed,
  };
  const result = await dispatchDesktopAction({ type: 'cafe-join-all' }, executors);
  assert.equal(result.success, false);
  const failedResult = result.result as { success: boolean; completed: number; failed: number; errorCode: string };
  assert.deepEqual({ success: failedResult.success, completed: failedResult.completed, failed: failedResult.failed }, { success: false, completed: 1, failed: 2 });
  assert.equal(failedResult.errorCode, 'operation_failed');
  assert.equal(result.errorCode, 'operation_failed');
  assert.equal(executions, 1);
  executors['cafe-join-all'] = async () => ({ success: true, completed: 3, failed: 0 });
  assert.equal((await dispatchDesktopAction({ type: 'cafe-join-all' }, executors)).success, true);
  console.log('desktop action dispatch harness passed');
};
void run();
