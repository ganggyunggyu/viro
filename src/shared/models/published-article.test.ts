import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createReplyIdentity,
  createPublishedArticleOperations,
  type PublishedArticleModelLike,
  type PublishedArticleUpdate,
} from './published-article';
import { shouldSkipReplyWrite } from '@/shared/lib/queue/reply-idempotency-harness';
import { persistWrittenReply } from '@/shared/lib/queue/reply-handler-harness';

interface FakeArticle {
  cafeId: string;
  articleId: number;
  status: string;
  isExternal?: boolean;
  publishedAt: Date;
  comments?: Array<{
    accountId: string;
    nickname: string;
    content: string;
    type: 'comment' | 'reply';
    parentIndex?: number;
    replyKey?: string;
    createdAt: Date;
  }>;
}

const createFakeModel = (initialArticles: FakeArticle[] = []): {
  articles: FakeArticle[];
  model: PublishedArticleModelLike<FakeArticle>;
} => {
  const articles = [...initialArticles];
  const model: PublishedArticleModelLike<FakeArticle> = {
    findOneAndUpdate: async (filter, update) => {
      const { cafeId, articleId } = filter;
      let article = articles.find((candidate) =>
        candidate.cafeId === cafeId && candidate.articleId === articleId,
      );

      if (!article) {
        article = {
          cafeId: String(cafeId),
          articleId: Number(articleId),
          status: String(update.$setOnInsert.status),
          isExternal: Boolean(update.$setOnInsert.isExternal),
          publishedAt: new Date('2026-07-20T00:00:00.000Z'),
          comments: [],
        };
        articles.push(article);
      }

      article.comments = [
        ...(article.comments || []),
        update.$push.comments,
      ];
      return article;
    },
    find: (filter) => ({
      sort: () => ({
        limit: async (limit) => {
          const externalFilter = filter.isExternal as { $ne?: unknown } | undefined;
          return articles
            .filter((article) =>
              article.cafeId === filter.cafeId
              && Array.isArray((filter.status as { $in?: unknown[] })?.$in)
              && (filter.status as { $in: unknown[] }).$in.includes(article.status)
              && (externalFilter?.$ne !== true || article.isExternal !== true),
            )
            .slice(0, limit);
        },
      }),
    }),
    findOne: (filter) => ({
      lean: async () => articles.find((article) =>
        article.cafeId === filter.cafeId && article.articleId === filter.articleId,
      ) ?? null,
    }),
  };

  return { articles, model };
};

test('external comment stub is marked and excluded from recent published articles', async () => {
  const { articles, model } = createFakeModel();
  const { addCommentToArticle, getRecentPublishedArticles } = createPublishedArticleOperations({
    model,
    log: () => {},
    now: () => new Date('2026-07-20T01:00:00.000Z'),
  });

  const added = await addCommentToArticle('25729954', 101, {
    accountId: 'commenter-a',
    nickname: '댓글러',
    content: '외부 글 댓글',
    type: 'comment',
  });
  const recent = await getRecentPublishedArticles('25729954', 30);

  assert.equal(added, true);
  assert.equal(articles[0]?.isExternal, true);
  assert.deepEqual(recent, []);
});

test('legacy published article without isExternal remains in recent articles', async () => {
  const legacyArticle: FakeArticle = {
    cafeId: '25729954',
    articleId: 102,
    status: 'published',
    publishedAt: new Date('2026-07-20T00:00:00.000Z'),
  };
  const { model } = createFakeModel([legacyArticle]);
  const { getRecentPublishedArticles } = createPublishedArticleOperations({ model, log: () => {} });

  const recent = await getRecentPublishedArticles('25729954', 30);

  assert.deepEqual(recent, [legacyArticle]);
});

test('external marker is part of the upsert-only stub payload', async () => {
  const capturedUpdates: PublishedArticleUpdate[] = [];
  const model: PublishedArticleModelLike<FakeArticle> = {
    findOneAndUpdate: async (_filter, update) => {
      capturedUpdates.push(update);
      return {
        cafeId: '25729954',
        articleId: 103,
        status: 'published',
        publishedAt: new Date(),
      };
    },
    find: () => ({
      sort: () => ({ limit: async () => [] }),
    }),
    findOne: () => ({ lean: async () => null }),
  };
  const { addCommentToArticle } = createPublishedArticleOperations({ model, log: () => {} });

  await addCommentToArticle('25729954', 103, {
    accountId: 'commenter-a',
    nickname: '댓글러',
    content: '댓글',
    type: 'comment',
  });

  assert.equal(capturedUpdates[0]?.$setOnInsert.isExternal, true);
  assert.equal(capturedUpdates[0]?.$setOnInsert.status, 'published');
});

test('adding a comment to an existing published article preserves isExternal false', async () => {
  const publishedArticle: FakeArticle = {
    cafeId: '31750114',
    articleId: 105,
    status: 'published',
    isExternal: false,
    publishedAt: new Date('2026-07-20T00:00:00.000Z'),
    comments: [],
  };
  const { articles, model } = createFakeModel([publishedArticle]);
  const { addCommentToArticle } = createPublishedArticleOperations({ model, log: () => {} });

  await addCommentToArticle('31750114', 105, {
    accountId: 'commenter-a',
    nickname: '댓글러',
    content: '기존 발행글 댓글',
    type: 'comment',
  });

  assert.equal(articles[0]?.isExternal, false);
});

test('reply identity is stable for article parent and content', () => {
  assert.equal(
    createReplyIdentity('reply-a', 2, ' 같은\n대댓글 '),
    createReplyIdentity('reply-a', 2, '같은 대댓글'),
  );
  assert.notEqual(
    createReplyIdentity('reply-a', 2, '같은 대댓글'),
    createReplyIdentity('reply-a', 3, '같은 대댓글'),
  );
  assert.notEqual(
    createReplyIdentity('reply-a', 2, '같은 대댓글'),
    createReplyIdentity('reply-b', 2, '같은 대댓글'),
  );
});

test('reply rerun skips the live write when the fake DB already has the reply', async () => {
  const { model } = createFakeModel();
  const operations = createPublishedArticleOperations({ model, log: () => {} });

  await operations.addCommentToArticle('25729954', 104, {
    accountId: 'reply-a',
    nickname: '답글러',
    content: '이미 작성한 대댓글',
    type: 'reply',
    parentIndex: 1,
  });

  let liveWriteCount = 0;
  const skipped = await shouldSkipReplyWrite(
    {
      accountId: 'reply-a',
      cafeId: '25729954',
      articleId: 104,
      parentIndex: 1,
      content: '이미 작성한 대댓글',
    },
    {
      hasReplied: operations.hasReplied,
    },
  );

  if (!skipped) liveWriteCount += 1;

  assert.equal(skipped, true);
  assert.equal(liveWriteCount, 0);
});

test('same fallback reply is deduplicated per account without blocking another account', async () => {
  const { model } = createFakeModel();
  const operations = createPublishedArticleOperations({ model, log: () => {} });

  await operations.addCommentToArticle('25729954', 106, {
    accountId: 'reply-a',
    nickname: '답글러 A',
    content: '같은 fallback 대댓글',
    type: 'reply',
    parentIndex: 1,
  });

  const sameAccountSkipped = await shouldSkipReplyWrite(
    {
      accountId: 'reply-a',
      cafeId: '25729954',
      articleId: 106,
      parentIndex: 1,
      content: '같은 fallback 대댓글',
    },
    { hasReplied: operations.hasReplied },
  );
  const otherAccountSkipped = await shouldSkipReplyWrite(
    {
      accountId: 'reply-b',
      cafeId: '25729954',
      articleId: 106,
      parentIndex: 1,
      content: '같은 fallback 대댓글',
    },
    { hasReplied: operations.hasReplied },
  );

  assert.equal(sameAccountSkipped, true);
  assert.equal(otherAccountSkipped, false);
});

test('written reply persistence failure cannot finish as success without a reply key', async () => {
  const throwingModel: PublishedArticleModelLike<FakeArticle> = {
    findOneAndUpdate: async () => {
      throw new Error('persist failed');
    },
    find: () => ({
      sort: () => ({ limit: async () => [] }),
    }),
    findOne: () => ({ lean: async () => null }),
  };
  const operations = createPublishedArticleOperations({ model: throwingModel, log: () => {} });

  const result = await persistWrittenReply(
    {
      accountId: 'reply-a',
      cafeId: '25729954',
      articleId: 107,
      nickname: '답글러 A',
      content: '작성은 성공한 대댓글',
      parentIndex: 1,
    },
    { addCommentToArticle: operations.addCommentToArticle },
  );

  assert.deepEqual(result, {
    success: false,
    error: '대댓글 DB 저장 실패: persist failed',
    willRetry: true,
  });
});
