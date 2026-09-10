import assert from 'node:assert/strict';
import test from 'node:test';
import { processActionTask } from './action-runner';

test('잃어버린 실행권한은 외부 작업을 수행하지 않는다', async () => {
  let executed = 0;
  await assert.rejects(() => processActionTask({ type: 'cafe-join-all' }, {
    heartbeat: async () => false, execute: async () => { executed += 1; return { success: true }; }, report: async () => true,
  }));
  assert.equal(executed, 0);
});

test('보고 실패는 외부 쓰기를 재실행하지 않는다', async () => {
  let executed = 0;
  await assert.rejects(() => processActionTask({ type: 'cafe-join-all' }, {
    heartbeat: async () => true, execute: async () => { executed += 1; return { success: true }; }, report: async () => false,
  }));
  assert.equal(executed, 1);
});

test('부분 실패는 결과 확인 필요로 보고하고 오류 원문을 저장하지 않는다', async () => {
  await processActionTask({ type: 'cafe-join-all' }, {
    heartbeat: async () => true, execute: async () => ({ success: false, error: 'synthetic-secret', result: { completed: 1, failed: 1 } }),
    report: async (result, uncertain) => {
      assert.equal(uncertain, true);
      assert.equal(JSON.stringify(result).includes('synthetic-secret'), false);
      assert.deepEqual(result.result, { completed: 1, failed: 1 });
      return true;
    },
  });
});
