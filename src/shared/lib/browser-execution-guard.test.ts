import assert from 'node:assert/strict';
import test from 'node:test';
import { assertBrowserExecutionAllowed, withBrowserExecutionGuard } from './browser-execution-guard';

test('standalone calls work normally but a lost embedded lease cannot reopen a browser', async () => {
  assert.doesNotThrow(assertBrowserExecutionAllowed);
  let ownsLease = true;
  await withBrowserExecutionGuard(() => ownsLease, async () => {
    assert.doesNotThrow(assertBrowserExecutionAllowed);
    ownsLease = false;
    await Promise.resolve();
    assert.throws(assertBrowserExecutionAllowed, /실행 권한/);
  });
  assert.doesNotThrow(assertBrowserExecutionAllowed);
});

test('concurrent execution scopes cannot borrow another operation lease', async () => {
  await Promise.all([
    withBrowserExecutionGuard(() => false, async () => {
      await Promise.resolve();
      assert.throws(assertBrowserExecutionAllowed);
    }),
    withBrowserExecutionGuard(() => true, async () => {
      await Promise.resolve();
      assert.doesNotThrow(assertBrowserExecutionAllowed);
    }),
  ]);
});

test('browser, context and page entry points reject a lost lease before browser launch', async () => {
  const { getBrowser, getContextForAccount, getPageForAccount, closeAllContexts } = await import('./multi-session');
  try {
    await withBrowserExecutionGuard(() => false, async () => {
      await assert.rejects(getBrowser(), /실행 권한/);
      await assert.rejects(getContextForAccount('fixture'), /실행 권한/);
      await assert.rejects(getPageForAccount('fixture'), /실행 권한/);
    });
  } finally { await closeAllContexts(); }
});
