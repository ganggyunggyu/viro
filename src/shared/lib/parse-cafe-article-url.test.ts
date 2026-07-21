import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCafeArticleUrlShape } from './parse-cafe-article-url';

test('parseCafeArticleUrlShape parses desktop ca-fe cafeId URL', () => {
  const result = parseCafeArticleUrlShape('https://cafe.naver.com/ca-fe/cafes/12345/articles/67');
  assert.deepEqual(result, { cafeId: '12345', articleId: 67 });
});

test('parseCafeArticleUrlShape parses mobile ca-fe web slug URL', () => {
  const result = parseCafeArticleUrlShape('https://cafe.naver.com/ca-fe/web/cafes/babycare702/articles/18');
  assert.deepEqual(result, { cafeSlug: 'babycare702', articleId: 18 });
});

test('parseCafeArticleUrlShape parses m.cafe short-link redirect shape', () => {
  const result = parseCafeArticleUrlShape('https://m.cafe.naver.com/babycare702/18?art=abc123');
  assert.deepEqual(result, { cafeSlug: 'babycare702', articleId: 18 });
});

test('parseCafeArticleUrlShape parses bare cafe.naver.com/{slug}/{articleId} shape', () => {
  const result = parseCafeArticleUrlShape('https://cafe.naver.com/talkmadang702/12');
  assert.deepEqual(result, { cafeSlug: 'talkmadang702', articleId: 12 });
});

test('parseCafeArticleUrlShape parses legacy slug + ArticleId query param', () => {
  const result = parseCafeArticleUrlShape('https://cafe.naver.com/babycare702?articleid=18');
  assert.deepEqual(result, { cafeSlug: 'babycare702', articleId: 18 });
});

test('parseCafeArticleUrlShape parses legacy ArticleRead clubid URL returned after publishing', () => {
  const result = parseCafeArticleUrlShape(
    'https://cafe.naver.com/ArticleRead.nhn?clubid=31750114&articleid=19&menuid=1&boardtype=L',
  );
  assert.deepEqual(result, { cafeId: '31750114', articleId: 19 });
});

test('parseCafeArticleUrlShape returns null for unrecognized URL', () => {
  const result = parseCafeArticleUrlShape('https://example.com/not-a-cafe-url');
  assert.equal(result, null);
});

test('parseCafeArticleUrlShape trims surrounding whitespace before matching', () => {
  const result = parseCafeArticleUrlShape('  https://cafe.naver.com/ca-fe/cafes/999/articles/1  ');
  assert.deepEqual(result, { cafeId: '999', articleId: 1 });
});

test('parseCafeArticleUrlShape prefers the desktop ca-fe pattern over the bare slug pattern', () => {
  const result = parseCafeArticleUrlShape('https://cafe.naver.com/ca-fe/cafes/12345/articles/67?tc=naver_search');
  assert.deepEqual(result, { cafeId: '12345', articleId: 67 });
});
