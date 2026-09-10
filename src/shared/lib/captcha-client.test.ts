import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasCaptchaApiConfig,
  resolveCaptchaApiUrl,
  resolveCaptchaToken,
  solveCaptchaViaScheduler,
} from './captcha-client';

const SIGNING_ENV = { JWT_SECRET: 'test-secret', CAPTCHA_OWNER_ID: 'owner-1' };

test('resolveCaptchaApiUrl: 기본값을 쓰고 끝 슬래시를 턴다', () => {
  assert.equal(resolveCaptchaApiUrl({}), 'https://21lab-scheduler.fly.dev');
  assert.equal(resolveCaptchaApiUrl({ CAPTCHA_API_URL: 'http://localhost:4000/' }), 'http://localhost:4000');
});

test('resolveCaptchaToken: 고정 토큰이 있으면 그대로 쓴다', () => {
  assert.equal(resolveCaptchaToken({ CAPTCHA_API_TOKEN: ' abc ', ...SIGNING_ENV }), 'abc');
});

test('resolveCaptchaToken: 비밀키가 있으면 서명해서 만든다', () => {
  const token = resolveCaptchaToken(SIGNING_ENV);
  const [header, payload, signature] = token.split('.');
  assert.ok(header && payload && signature);

  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  assert.equal(claims.sub, 'owner-1');
  assert.ok(claims.exp > Math.floor(Date.now() / 1000));
});

test('resolveCaptchaToken: 정보가 모자라면 빈 문자열', () => {
  assert.equal(resolveCaptchaToken({}), '');
  assert.equal(resolveCaptchaToken({ JWT_SECRET: 's' }), '');
  assert.equal(resolveCaptchaToken({ CAPTCHA_OWNER_ID: 'o' }), '');
  assert.equal(hasCaptchaApiConfig({}), false);
  assert.equal(hasCaptchaApiConfig(SIGNING_ENV), true);
});

test('solveCaptchaViaScheduler: kind 와 question 을 그대로 실어 보낸다', async () => {
  let seen: { url: string; body: Record<string, unknown>; auth: string } | null = null;
  const fetcher = (async (url: string, init: RequestInit) => {
    seen = {
      url,
      body: JSON.parse(String(init.body)),
      auth: String((init.headers as Record<string, string>).authorization),
    };
    return { ok: true, json: async () => ({ answer: ' A1B2 ' }) };
  }) as unknown as typeof fetch;

  const answer = await solveCaptchaViaScheduler(
    { image: 'BASE64', kind: 'cafe-join' },
    { environment: SIGNING_ENV, fetcher },
  );

  assert.equal(answer, 'A1B2');
  assert.equal(seen!.url, 'https://21lab-scheduler.fly.dev/api/captcha/solve');
  assert.equal(seen!.body.kind, 'cafe-join');
  assert.equal(seen!.body.image, 'BASE64');
  assert.ok(seen!.auth.startsWith('Bearer '));
});

test('solveCaptchaViaScheduler: 인증 정보가 없으면 부르기 전에 막는다', async () => {
  let called = false;
  const fetcher = (async () => { called = true; return { ok: true, json: async () => ({}) }; }) as unknown as typeof fetch;

  await assert.rejects(
    solveCaptchaViaScheduler({ image: 'x', kind: 'login' }, { environment: {}, fetcher }),
    (error: unknown) => (error as { code: string }).code === 'captcha_service_authentication_required',
  );
  assert.equal(called, false);
});

test('solveCaptchaViaScheduler: 오류 응답과 빈 답변을 구분해서 던진다', async () => {
  const failing = (async () => ({ ok: false, status: 502, json: async () => ({}) })) as unknown as typeof fetch;
  await assert.rejects(
    solveCaptchaViaScheduler({ image: 'x', kind: 'login' }, { environment: SIGNING_ENV, fetcher: failing }),
    (error: unknown) => (error as { code: string }).code === 'captcha_service_unavailable',
  );

  const empty = (async () => ({ ok: true, json: async () => ({ answer: '  ' }) })) as unknown as typeof fetch;
  await assert.rejects(
    solveCaptchaViaScheduler({ image: 'x', kind: 'login' }, { environment: SIGNING_ENV, fetcher: empty }),
    (error: unknown) => (error as { code: string }).code === 'captcha_service_invalid_response',
  );
});
