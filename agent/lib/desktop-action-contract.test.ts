import assert from 'node:assert/strict';
import test from 'node:test';
import { validateDesktopAction } from './desktop-action-contract';

test('validates account login input', () => {
  assert.deepEqual(validateDesktopAction({ type: 'account-login', accountId: 'writer01' }), {
    type: 'account-login',
    accountId: 'writer01',
  });
  assert.throws(() => validateDesktopAction({ type: 'account-login', accountId: '' }), /계정을 선택/);
});

test('requires the selected nickname target', () => {
  assert.throws(
    () => validateDesktopAction({ type: 'nickname-change', mode: 'by-cafe' }),
    /카페를 선택/,
  );
  assert.throws(
    () => validateDesktopAction({ type: 'nickname-change', mode: 'by-account' }),
    /계정을 선택/,
  );
});

test('rejects unsupported actions', () => {
  assert.throws(() => validateDesktopAction({ type: 'unknown' }), /지원하지 않는/);
});
