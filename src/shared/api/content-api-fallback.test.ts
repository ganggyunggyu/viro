import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateImages,
  generateTeteContentByServiceWithFallback,
  generateTeteContentWithFallback,
} from './content-api';

interface FetchCall {
  url: string;
  body: Record<string, unknown>;
}

const asRequestBody = (init?: RequestInit): Record<string, unknown> => {
  if (typeof init?.body !== 'string') return {};
  return JSON.parse(init.body) as Record<string, unknown>;
};

test('generateTeteContent falls back to cafe-total when production has no tete route', async (context) => {
  const originalFetch = globalThis.fetch;
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, body: asRequestBody(init) });

    if (url.endsWith('/generate/tete')) {
      return new Response('{"detail":"Not Found"}', { status: 404 });
    }

    return Response.json({
      content: '# 운영 원고\n\n본문',
      keyword: '마운자로 처방',
      model: 'gemini',
      char_count: 10,
      elapsed: 1,
    });
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const result = await generateTeteContentWithFallback({
    keyword: '마운자로 처방',
    ref: '공식 정보만 참고',
  });

  assert.equal(result.content, '# 운영 원고\n\n본문');
  assert.equal(result.contentType, '정보성');
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /\/generate\/tete$/);
  assert.match(calls[1].url, /\/generate\/cafe-total$/);
  assert.deepEqual(calls[1].body, {
    keyword: '마운자로 처방',
    ref: '공식 정보만 참고',
  });
});

test('generateTeteContentByService keeps the service in the fallback keyword', async (context) => {
  const originalFetch = globalThis.fetch;
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, body: asRequestBody(init) });

    if (url.endsWith('/generate/tete')) {
      return new Response('', { status: 405 });
    }

    return Response.json({ content: '# 수정 원고\n\n본문' });
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const result = await generateTeteContentByServiceWithFallback({
    service: '맛집',
    keyword: '동네 밥집',
  });

  assert.equal(result.content, '# 수정 원고\n\n본문');
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].body, {
    keyword: '동네 밥집:맛집',
    ref: '',
  });
});

test('generateImages degrades to an empty result on an upstream network failure', async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed');
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const result = await generateImages({ keyword: '마운자로 처방', count: 3 });

  assert.deepEqual(result, {
    success: false,
    images: [],
    error: '이미지 생성 네트워크 오류',
  });
});
