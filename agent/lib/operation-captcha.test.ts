import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { createOperationClient } from './operation-client';
import { hasCaptchaApiConfig, solveCaptchaViaScheduler, withCaptchaSolver } from '../../src/shared/lib/captcha-client';

test('paired worker login and cafe join captcha use Viro token without scheduler secrets', async () => {
  const seen: Array<{ url: string; auth: string; kind: string }> = [];
  const fetchMock = mock.method(globalThis, 'fetch', async (url: string | URL | Request, init?: RequestInit) => {
    seen.push({ url: String(url), auth: new Headers(init?.headers).get('authorization') || '', kind: JSON.parse(String(init?.body)).kind });
    return Response.json({ answer: 'AB12' });
  });
  try {
    const client = createOperationClient({ brokerUrl: 'https://viro.example', token: 'paired-token', workerId: 'test', browsersPath: '', pollIntervalMs: 1000 });
    assert.equal(hasCaptchaApiConfig({}), false);
    await withCaptchaSolver(client.solveCaptcha, async () => {
      assert.equal(hasCaptchaApiConfig({}), true);
      for (const kind of ['login', 'cafe-join'] as const) {
        assert.equal(await solveCaptchaViaScheduler({ image: 'fixture', kind }, { environment: {} }), 'AB12');
      }
    });
    assert.equal(hasCaptchaApiConfig({}), false);
    assert.deepEqual(seen, ['login', 'cafe-join'].map((kind) => ({ url: 'https://viro.example/api/agent/captcha', auth: 'Bearer paired-token', kind })));
  } finally { fetchMock.mock.restore(); }
});

test('parallel captcha scopes cannot use another worker credential', async () => {
  const run = (answer: string) => withCaptchaSolver(async () => answer, async () => {
    await Promise.resolve();
    return solveCaptchaViaScheduler({ image: 'fixture', kind: 'login' }, { environment: {} });
  });
  assert.deepEqual(await Promise.all([run('worker-a'), run('worker-b')]), ['worker-a', 'worker-b']);
});
