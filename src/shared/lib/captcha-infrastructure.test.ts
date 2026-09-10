import assert from 'node:assert/strict';
import test from 'node:test';
import type { Page } from 'playwright';
import { withCaptchaSolver } from './captcha-client';
import { CaptchaServiceError } from './captcha-service-error';
import { solveCaptchaOnPage } from './captcha-solver';
import { solveCafeJoinCaptchaOnPage } from './naver-cafe-membership';
import { safeOperationFailure } from './agent-management/operation-failure';

const pageForLogin = () => {
  let reads = 0;
  return { evaluate: async () => ['receipt', 'aW1hZ2U=', 'fixture'][reads++ % 3], url: () => 'https://nid.naver.com/nidlogin.login' } as unknown as Page;
};
const pageForJoin = () => {
  const locator = { first: () => locator, isVisible: async () => true, screenshot: async () => Buffer.from('fixture'), count: async () => 0 };
  return { locator: () => locator, waitForTimeout: async () => {} } as unknown as Page;
};
for (const kind of ['login', 'cafe-join'] as const) test(`${kind} infrastructure failures preserve their cause and do not retry or submit a form`, async () => {
  let calls = 0;
  const error = new CaptchaServiceError('captcha_service_unavailable');
  await withCaptchaSolver(async () => { calls += 1; throw error; }, async () => {
    const result = kind === 'login' ? await solveCaptchaOnPage(pageForLogin(), 'fixture') : await solveCafeJoinCaptchaOnPage(pageForJoin(), 'fixture');
    assert.equal(result.solved, false);
    assert.equal(result.error, error.message);
    assert.equal(result.attempts, 1);
    assert.equal(safeOperationFailure(result.error).errorCode, 'captcha_service_unavailable');
  });
  assert.equal(calls, 1);
});

test('legacy scoped infrastructure exceptions are converted to safe typed failures', async () => {
  await withCaptchaSolver(async () => { throw new Error('private-token network outage'); }, async () => {
    const result = await solveCaptchaOnPage(pageForLogin(), 'fixture');
    assert.equal(result.attempts, 1);
    assert.equal(safeOperationFailure(result.error).errorCode, 'captcha_service_unavailable');
    assert.doesNotMatch(result.error || '', /private-token/);
  });
});
