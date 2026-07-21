import assert from 'node:assert/strict';
import test from 'node:test';
import { createLikeJobHandler } from './like-handler-harness';
import type { LikeJobData } from '../types';

const data: LikeJobData = {
  type: 'like',
  accountId: 'account-1',
  cafeId: 'cafe-1',
  articleId: 101,
};
const account = { id: 'account-1', password: 'pw' };

test('like job succeeds for both a new like and an already-liked duplicate', async () => {
  for (const articleLiked of [true, false]) {
    const handle = createLikeJobHandler({
      likeArticle: async () => ({ accountId: account.id, success: true, articleLiked }),
    });

    assert.deepEqual(await handle(data, { account, settings: { timeout: 100 } }), { success: true });
  }
});

test('like job returns article-not-ready as a soft result and throws other failures', async () => {
  const notReady = createLikeJobHandler({
    likeArticle: async () => ({
      accountId: account.id,
      success: false,
      error: 'ARTICLE_NOT_READY:준비 중',
    }),
    log: () => undefined,
  });
  const failed = createLikeJobHandler({
    likeArticle: async () => ({ accountId: account.id, success: false, error: '클릭 실패' }),
  });

  assert.deepEqual(await notReady(data, { account, settings: { timeout: 100 } }), {
    success: false,
    error: 'ARTICLE_NOT_READY:준비 중',
  });
  await assert.rejects(() => failed(data, { account, settings: { timeout: 100 } }), /클릭 실패/);
});
