import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPostWriteFailure,
  extractArticleIdFromUrl,
  findRecentArticleBySubject,
} from './post-writer-utils';

test('extractArticleIdFromUrl returns articleId from direct article url', () => {
  const articleId = extractArticleIdFromUrl(
    'https://cafe.naver.com/ca-fe/cafes/25227349/articles/1109'
  );

  assert.equal(articleId, 1109);
});

test('extractArticleIdFromUrl returns articleId from double-encoded iframe url', () => {
  const nestedUrl =
    'https://cafe.naver.com/MyCafe?iframe_url_utf8=' +
    encodeURIComponent(
      encodeURIComponent('/ArticleRead.nhn?clubid=25227349&articleid=1109')
    );

  const articleId = extractArticleIdFromUrl(nestedUrl);

  assert.equal(articleId, 1109);
});

test('extractArticleIdFromUrl returns undefined for write url', () => {
  const articleId = extractArticleIdFromUrl(
    'https://cafe.naver.com/ca-fe/cafes/25227349/articles/write?boardType=L&menuId=1'
  );

  assert.equal(articleId, undefined);
});

test('findRecentArticleBySubject prefers a newly appeared article', () => {
  const articles = [
    {
      articleId: 1085,
      subject: '우리아이예상키',
      writeDateTimestamp: 1_000,
      menuId: 1,
    },
    {
      articleId: 1109,
      subject: '우리아이예상키',
      writeDateTimestamp: 2_000,
      menuId: 1,
    },
  ];

  const match = findRecentArticleBySubject(articles, '우리아이예상키', {
    knownArticleIds: new Set([1085]),
    publishStartedAt: 1_900,
    menuId: 1,
  });

  assert.ok(match);
  assert.equal(match.articleId, 1109);
});

test('findRecentArticleBySubject rejects ambiguous fresh matches', () => {
  const match = findRecentArticleBySubject([
    {
      articleId: 1110,
      subject: '동일 제목',
      writeDateTimestamp: 2_000,
      menuId: 1,
    },
    {
      articleId: 1111,
      subject: '동일 제목',
      writeDateTimestamp: 2_100,
      menuId: 1,
    },
  ], '동일 제목', {
    publishStartedAt: 1_900,
    menuId: 1,
  });

  assert.equal(match, undefined);
});

test('findRecentArticleBySubject never falls back before publishStartedAt', () => {
  const match = findRecentArticleBySubject([
    {
      articleId: 1085,
      subject: '이전 제목',
      writeDateTimestamp: 1_000,
      menuId: 1,
    },
  ], '이전 제목', {
    publishStartedAt: 1_900,
    menuId: 1,
  });

  assert.equal(match, undefined);
});

test('buildPostWriteFailure retains an observed article after a follow-up error', () => {
  const result = buildPostWriteFailure({
    writerAccountId: 'writer-1',
    error: new Error('cookie save failed'),
    articleId: 1206,
    articleUrl: 'https://cafe.naver.com/ca-fe/cafes/31750114/articles/1206',
  });

  assert.equal(result.success, false);
  assert.equal(result.articleId, 1206);
  assert.equal(result.articleUrl, 'https://cafe.naver.com/ca-fe/cafes/31750114/articles/1206');
  assert.equal(result.error, 'cookie save failed');
});
