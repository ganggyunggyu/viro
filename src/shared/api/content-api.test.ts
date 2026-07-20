import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isLocalContentApiUrl,
  resolveWithDirectContentFallback,
  shouldUseDirectContentFallback,
} from './content-api';

test('isLocalContentApiUrl detects localhost endpoints', () => {
  assert.equal(isLocalContentApiUrl('http://localhost:8000'), true);
  assert.equal(isLocalContentApiUrl('http://127.0.0.1:8000/generate/tete'), true);
  assert.equal(isLocalContentApiUrl('https://api.example.com'), false);
});

test('shouldUseDirectContentFallback activates for local content api base', () => {
  const error = new Error('unexpected 500');
  assert.equal(shouldUseDirectContentFallback(error, 'http://localhost:8000'), true);
});

test('resolveWithDirectContentFallback uses fallback when fetch fails against local api', async () => {
  const result = await resolveWithDirectContentFallback(
    async () => {
      throw new TypeError('fetch failed');
    },
    async () => 'fallback-result',
    'http://localhost:8000',
  );

  assert.equal(result, 'fallback-result');
});

test('resolveWithDirectContentFallback rethrows non-network remote errors', async () => {
  await assert.rejects(
    () => resolveWithDirectContentFallback(
      async () => {
        throw new Error('테테 원고 생성 실패: 500 - upstream broke');
      },
      async () => 'fallback-result',
      'https://content.example.com',
    ),
    /upstream broke/,
  );
});
