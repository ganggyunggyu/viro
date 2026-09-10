import assert from 'node:assert/strict';
import test from 'node:test';
import { processActionTask } from './action-runner';
import { dispatchDesktopAction } from './desktop-action-dispatch';

const executorsFor = (execute: () => Promise<unknown>) => ({
  'account-login': execute, 'cafe-join-all': execute, 'nickname-change': execute,
  'exposure-check': execute, 'cafe-create': execute, 'manual-publish': execute,
  'manual-modify': execute, rewrite: execute,
});

test('a known account login failure retains its cause through dispatch and reporting without claiming uncertainty', async () => {
  for (const [error, code] of [['캡차 풀이 실패: private-token', 'captcha_required'], ['로그인 대기 시간 초과. 추가 인증 여부를 확인해주세요.', 'additional_authentication_required'], ['로그인 실패 private-password', 'login_failed']]) {
    let executions = 0;
    await processActionTask({ type: 'account-login', accountId: 'fixture' }, {
      heartbeat: async () => true,
      execute: async (action) => dispatchDesktopAction(action, executorsFor(async () => { executions += 1; return { success: false, error }; })),
      report: async (result, uncertain) => {
        assert.equal(uncertain, false);
        assert.equal((result as unknown as { errorCode: string }).errorCode, code);
        assert.doesNotMatch(JSON.stringify(result), /private-/);
        return true;
      },
    });
    assert.equal(executions, 1);
  }
});

test('unknown account failure and partial external writes retain uncertainty', async () => {
  for (const action of [{ type: 'account-login' as const, accountId: 'fixture' }, { type: 'cafe-join-all' as const }]) {
    await processActionTask(action, {
      heartbeat: async () => true,
      execute: async () => ({ success: false, error: action.type === 'account-login' ? 'unknown-private' : '로그인 실패 private-password' }),
      report: async (result, uncertain) => { assert.equal(uncertain, true); assert.doesNotMatch(JSON.stringify(result), /private/); return true; },
    });
  }
});

test('dispatch preserves a classified exception without leaking its original contents', async () => {
  const result = await dispatchDesktopAction({ type: 'account-login', accountId: 'fixture' }, executorsFor(async () => { throw new Error('바이로에 다시 로그인해 주세요. private-cookie'); }));
  assert.equal(result.success, false);
  assert.equal((result as unknown as { errorCode: string }).errorCode, 'authentication_required');
  assert.doesNotMatch(JSON.stringify(result), /private-cookie/);
});

test('executor throws remain classified and unknown throws require review', async () => {
  for (const error of ['로그인 실패 private-password', 'unexpected-private']) {
    await processActionTask({ type: 'account-login', accountId: 'fixture' }, {
      heartbeat: async () => true, execute: async () => { throw new Error(error); },
      report: async (result, uncertain) => {
        assert.equal(uncertain, error.startsWith('unexpected'));
        assert.doesNotMatch(JSON.stringify(result), /private/);
        return true;
      },
    });
  }
});
