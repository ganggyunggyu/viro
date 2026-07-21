import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasCaptchaBrokerConfig,
  solveCaptchaViaBroker,
} from '@/shared/lib/captcha-broker';

test('broker credentials enable captcha solving without a local Gemini key', () => {
  assert.equal(
    hasCaptchaBrokerConfig({
      BROKER_URL: 'https://cafe-bot-two.vercel.app',
      AGENT_TOKEN: 'agent-token',
    }),
    true,
  );
  assert.equal(hasCaptchaBrokerConfig({ BROKER_URL: '', AGENT_TOKEN: '' }), false);
});

test('captcha broker returns only the solved answer', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const answer = await solveCaptchaViaBroker(
    {
      kind: 'login',
      image: 'base64-image',
      question: '전화번호의 끝 두 자리는?',
    },
    {
      environment: {
        BROKER_URL: 'https://cafe-bot-two.vercel.app/',
        AGENT_TOKEN: 'agent-token',
      },
      fetcher: async (url, init) => {
        requests.push({ url: String(url), init });
        return new Response(JSON.stringify({ answer: '42' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    },
  );

  assert.equal(answer, '42');
  assert.equal(requests[0]?.url, 'https://cafe-bot-two.vercel.app/api/agent/captcha');
  assert.deepEqual(JSON.parse(String(requests[0]?.init?.body)), {
    kind: 'login',
    image: 'base64-image',
    question: '전화번호의 끝 두 자리는?',
  });
  assert.equal(
    (requests[0]?.init?.headers as Record<string, string>).authorization,
    'Bearer agent-token',
  );
});

test('captcha broker reports server errors without exposing response bodies', async () => {
  await assert.rejects(
    solveCaptchaViaBroker(
      { kind: 'cafe-join', image: 'base64-image' },
      {
        environment: {
          BROKER_URL: 'https://cafe-bot-two.vercel.app',
          AGENT_TOKEN: 'agent-token',
        },
        fetcher: async () => new Response('internal details', { status: 500 }),
      },
    ),
    /캡차 해석 서버 오류 \(500\)/,
  );
});
