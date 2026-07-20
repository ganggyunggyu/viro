import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPublishedArticleOperations,
  type PublishedArticleModelLike,
  type PublishedArticleUpdate,
} from './published-article';

interface FakeArticle {
  cafeId: string;
  articleId: number;
  status: string;
  isExternal?: boolean;
  publishedAt: Date;
  comments?: unknown[];
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
        limit: async (limit) => articles
          .filter((article) =>
            article.cafeId === filter.cafeId
            && Array.isArray((filter.status as { $in?: unknown[] })?.$in)
            && (filter.status as { $in: unknown[] }).$in.includes(article.status)
            && article.isExternal !== true,
          )
          .slice(0, limit),
      }),
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
  let capturedUpdate: PublishedArticleUpdate | null = null;
  const model: PublishedArticleModelLike<FakeArticle> = {
    findOneAndUpdate: async (_filter, update) => {
      capturedUpdate = update;
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
  };
  const { addCommentToArticle } = createPublishedArticleOperations({ model, log: () => {} });

  await addCommentToArticle('25729954', 103, {
    accountId: 'commenter-a',
    nickname: '댓글러',
    content: '댓글',
    type: 'comment',
  });

  assert.equal(capturedUpdate?.$setOnInsert.isExternal, true);
  assert.equal(capturedUpdate?.$setOnInsert.status, 'published');
});
