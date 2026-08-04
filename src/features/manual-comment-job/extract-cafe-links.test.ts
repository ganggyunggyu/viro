import assert from 'node:assert/strict';
import test from 'node:test';

import { extractCafeLinks } from './extract-cafe-links';

test('extractCafeLinks collects every cafe link from free-form text', () => {
  const raw = [
    '오늘 작업분입니다',
    'https://cafe.naver.com/babsangnote702/14',
    '두번째 https://naver.me/5c8bfNME 이거도 같이',
    'https://cafe.naver.com/ca-fe/cafes/31766238/articles/7',
  ].join('\n');

  assert.deepEqual(extractCafeLinks(raw), [
    'https://cafe.naver.com/babsangnote702/14',
    'https://naver.me/5c8bfNME',
    'https://cafe.naver.com/ca-fe/cafes/31766238/articles/7',
  ]);
});

test('extractCafeLinks dedupes repeated links while preserving order', () => {
  const raw = [
    'https://cafe.naver.com/tastetrip702/7',
    'https://cafe.naver.com/localtable702/3',
    'https://cafe.naver.com/tastetrip702/7',
  ].join('\n');

  assert.deepEqual(extractCafeLinks(raw), [
    'https://cafe.naver.com/tastetrip702/7',
    'https://cafe.naver.com/localtable702/3',
  ]);
});

test('extractCafeLinks accepts links without a protocol', () => {
  assert.deepEqual(extractCafeLinks('cafe.naver.com/menunote702/9'), [
    'https://cafe.naver.com/menunote702/9',
  ]);
  assert.deepEqual(extractCafeLinks('naver.me/xAbC123'), ['https://naver.me/xAbC123']);
});

test('extractCafeLinks strips trailing punctuation that is not part of the url', () => {
  assert.deepEqual(extractCafeLinks('링크는 https://cafe.naver.com/petinfo183/21 입니다.'), [
    'https://cafe.naver.com/petinfo183/21',
  ]);
  assert.deepEqual(extractCafeLinks('(https://naver.me/5UVeICxC)'), ['https://naver.me/5UVeICxC']);
});

test('extractCafeLinks ignores non-cafe urls', () => {
  const raw = 'https://blog.naver.com/foo/123 https://example.com/cafe.naver.com.fake';
  assert.deepEqual(extractCafeLinks(raw), []);
});

test('extractCafeLinks returns an empty list for blank input', () => {
  assert.deepEqual(extractCafeLinks(''), []);
  assert.deepEqual(extractCafeLinks('   \n  '), []);
});
