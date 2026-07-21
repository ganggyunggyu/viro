import assert from 'node:assert/strict';
import test from 'node:test';

import { selectExternalArticleStubs } from './backfill-external-article-stubs';

test('selectExternalArticleStubs finds legacy stub signatures without touching published posts', () => {
  const records = [
    { _id: 'empty-writer', writerAccountId: '', title: '일반 제목', menuId: '1', keyword: '키워드', content: '본문' },
    { _id: 'full-stub', writerAccountId: 'unknown', title: '외부 글', menuId: '', keyword: '', content: '' },
    { _id: 'published', writerAccountId: 'writer-a', title: '발행 글', menuId: '1', keyword: '키워드', content: '본문' },
    { _id: 'already-marked', writerAccountId: '', title: '외부 글', menuId: '', keyword: '', content: '', isExternal: true },
  ];

  assert.deepEqual(
    selectExternalArticleStubs(records).map(({ _id }) => _id),
    ['full-stub'],
  );
});
