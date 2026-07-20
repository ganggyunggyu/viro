import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createClaimPostAttempt,
  createReleasePostAttempt,
} from '@/shared/models/post-attempt-utils';
import {
  type PostOutcomeDeps,
  type PublishedArticleRecord,
  resolvePostOutcome,
} from './post-outcome-harness';

const POST_DATA = {
  cafeId: '31750114',
  menuId: '1',
  keyword: '발행 정합성 키워드',
  subject: '발행 정합성 제목',
  content: '본문',
  writerAccountId: 'writer-1',
  postType: 'ad' as const,
};

const createDeps = (
  overrides: Partial<PostOutcomeDeps> = {},
): {
  deps: PostOutcomeDeps;
  created: PublishedArticleRecord[];
  sheetRows: PublishedArticleRecord[];
  commentChains: number[];
} => {
  const created: PublishedArticleRecord[] = [];
  const sheetRows: PublishedArticleRecord[] = [];
  const commentChains: number[] = [];

  const deps: PostOutcomeDeps = {
    claimPostAttempt: async () => true,
    releaseClaim: async () => undefined,
    writer: async () => ({
      success: true,
      writerAccountId: POST_DATA.writerAccountId,
      articleId: 1201,
      articleUrl: 'https://cafe.naver.com/observed/1201',
    }),
    findRecentArticleBySubject: async () => undefined,
    publishedArticle: {
      create: async (record) => {
        created.push(record);
      },
    },
    sheetLogger: async (record) => {
      sheetRows.push(record);
      return { success: true };
    },
    incrementTodayPostCount: async () => undefined,
    enqueueCommentChain: async (articleId) => {
      commentChains.push(articleId);
    },
    now: () => Date.parse('2026-07-20T01:00:00.000Z'),
    onNonFatalError: () => undefined,
    ...overrides,
  };

  return { deps, created, sheetRows, commentChains };
};

test('verified write persists the observed URL and enqueues the comment chain', async () => {
  const { deps, created, commentChains } = createDeps();

  const result = await resolvePostOutcome({ post: POST_DATA, deps });

  assert.equal(result.success, true);
  assert.equal(result.articleId, 1201);
  assert.equal(created.length, 1);
  assert.equal(created[0].status, 'published');
  assert.equal(created[0].articleUrl, 'https://cafe.naver.com/observed/1201');
  assert.deepEqual(commentChains, [1201]);
});

test('missing articleId is recovered by subject without submitting again', async () => {
  let writeCount = 0;
  let recoveryCount = 0;
  const { deps, created, commentChains } = createDeps({
    writer: async () => {
      writeCount += 1;
      return {
        success: true,
        writerAccountId: POST_DATA.writerAccountId,
        articleUrl: 'https://cafe.naver.com/observed-after-submit',
      };
    },
    findRecentArticleBySubject: async ({ subject, publishStartedAt }) => {
      recoveryCount += 1;
      assert.equal(subject, POST_DATA.subject);
      assert.equal(publishStartedAt, Date.parse('2026-07-20T01:00:00.000Z'));
      return { articleId: 1202 };
    },
  });

  const result = await resolvePostOutcome({ post: POST_DATA, deps });

  assert.equal(result.success, true);
  assert.equal(result.articleId, 1202);
  assert.equal(writeCount, 1);
  assert.equal(recoveryCount, 1);
  assert.equal(created[0].status, 'published');
  assert.deepEqual(commentChains, [1202]);
});

test('unrecovered observed publish is stored and logged as published-unverified', async () => {
  const observedUrl = 'https://cafe.naver.com/ca-fe/cafes/31750114/articles/write?menuId=1';
  const { deps, created, sheetRows, commentChains } = createDeps({
    writer: async () => ({
      success: false,
      writerAccountId: POST_DATA.writerAccountId,
      articleUrl: observedUrl,
      error: 'articleId 추출 실패',
    }),
  });

  const result = await resolvePostOutcome({ post: POST_DATA, deps });

  assert.equal(result.success, true);
  assert.equal(result.articleId, undefined);
  assert.equal(result.articleUrl, observedUrl);
  assert.equal(created[0].status, 'published-unverified');
  assert.equal(created[0].articleUrl, observedUrl);
  assert.equal(sheetRows[0].status, 'published-unverified');
  assert.equal(sheetRows[0].articleUrl, observedUrl);
  assert.deepEqual(commentChains, []);
});

test('duplicate retry is rejected by an E11000 claim and skips the second submit', async () => {
  const seenKeys = new Set<string>();
  const claimPostAttempt = createClaimPostAttempt(
    {
      create: async ({ attemptKey }) => {
        if (seenKeys.has(attemptKey)) {
          throw Object.assign(new Error('duplicate key'), { code: 11000 });
        }
        seenKeys.add(attemptKey);
      },
    },
    () => Date.parse('2026-07-20T01:00:00.000Z'),
  );
  let writeCount = 0;
  const { deps } = createDeps({
    claimPostAttempt,
    writer: async () => {
      writeCount += 1;
      return {
        success: true,
        writerAccountId: POST_DATA.writerAccountId,
        articleId: 1203,
      };
    },
  });

  const first = await resolvePostOutcome({ post: POST_DATA, deps });
  const second = await resolvePostOutcome({ post: POST_DATA, deps });

  assert.equal(first.success, true);
  assert.equal(second.success, true);
  assert.equal(second.skipped, true);
  assert.equal(writeCount, 1);
});

test('observed articleUrl wins over the reconstructed fallback URL', async () => {
  const observedUrl = 'https://cafe.naver.com/custom-observed-link';
  const { deps, created } = createDeps({
    writer: async () => ({
      success: true,
      writerAccountId: POST_DATA.writerAccountId,
      articleId: 1204,
      articleUrl: observedUrl,
    }),
  });

  await resolvePostOutcome({ post: POST_DATA, deps });

  assert.equal(created[0].articleUrl, observedUrl);
});

test('unobserved write releases its claim so a retry can write again', async () => {
  const seenKeys = new Set<string>();
  const model = {
    create: async ({ attemptKey }: { attemptKey: string }) => {
      if (seenKeys.has(attemptKey)) {
        throw Object.assign(new Error('duplicate key'), { code: 11000 });
      }
      seenKeys.add(attemptKey);
    },
    deleteOne: async ({ attemptKey }: { attemptKey: string }) => {
      seenKeys.delete(attemptKey);
    },
  };
  const now = () => Date.parse('2026-07-20T01:00:00.000Z');
  let writeCount = 0;
  const { deps } = createDeps({
    claimPostAttempt: createClaimPostAttempt(model, now),
    releaseClaim: createReleasePostAttempt(model, now),
    writer: async () => {
      writeCount += 1;
      if (writeCount === 1) {
        return {
          success: false,
          writerAccountId: POST_DATA.writerAccountId,
          error: '관측되지 않은 발행 실패',
        };
      }
      return {
        success: true,
        writerAccountId: POST_DATA.writerAccountId,
        articleId: 1205,
      };
    },
  });

  await assert.rejects(
    resolvePostOutcome({ post: POST_DATA, deps }),
    /관측되지 않은 발행 실패/,
  );
  const retry = await resolvePostOutcome({ post: POST_DATA, deps });

  assert.equal(retry.articleId, 1205);
  assert.equal(writeCount, 2);
});

test('writer exception retains its claim and skips the retry', async () => {
  const seenKeys = new Set<string>();
  const model = {
    create: async ({ attemptKey }: { attemptKey: string }) => {
      if (seenKeys.has(attemptKey)) {
        throw Object.assign(new Error('duplicate key'), { code: 11000 });
      }
      seenKeys.add(attemptKey);
    },
    deleteOne: async ({ attemptKey }: { attemptKey: string }) => {
      seenKeys.delete(attemptKey);
    },
  };
  const now = () => Date.parse('2026-07-20T01:00:00.000Z');
  let writeCount = 0;
  const { deps } = createDeps({
    claimPostAttempt: createClaimPostAttempt(model, now),
    releaseClaim: createReleasePostAttempt(model, now),
    writer: async () => {
      writeCount += 1;
      throw new Error('타임아웃');
    },
  });

  await assert.rejects(resolvePostOutcome({ post: POST_DATA, deps }), /타임아웃/);
  const retry = await resolvePostOutcome({ post: POST_DATA, deps });

  assert.equal(retry.skipped, true);
  assert.equal(writeCount, 1);
});

test('unverified record failure uses a distinct non-fatal error stage', async () => {
  const errors: Array<{ stage: string; error: unknown }> = [];
  const { deps } = createDeps({
    writer: async () => ({
      success: true,
      writerAccountId: POST_DATA.writerAccountId,
      articleUrl: 'https://cafe.naver.com/observed-without-id',
    }),
    publishedArticle: {
      create: async () => {
        throw new Error('E11000 duplicate key');
      },
    },
    onNonFatalError: (stage, error) => {
      errors.push({ stage, error });
    },
  });

  await resolvePostOutcome({ post: POST_DATA, deps });

  assert.equal(errors[0]?.stage, 'published-article-unverified');
  assert.match(String(errors[0]?.error), /E11000/);
});
