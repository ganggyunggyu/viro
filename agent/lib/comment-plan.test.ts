import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCommentPlan } from './comment-plan';
import type { BrokerJob } from './broker-client';

const createJob = (overrides: Partial<BrokerJob> = {}): BrokerJob => ({
  _id: 'job-1',
  userId: 'user-1',
  articleUrl: 'https://cafe.naver.com/example/1',
  cafeSlug: 'example',
  cafeId: '100',
  articleId: 1,
  mode: 'fixed',
  fixedComments: [' 첫 댓글 ', '', '둘째 댓글'],
  delayMinMs: 1_000,
  delayMaxMs: 2_000,
  deleteExisting: false,
  ...overrides,
});

const article = {
  title: '테스트 제목',
  body: '테스트 본문',
  ownerNickname: '글쓴이',
};

test('resolveCommentPlan keeps fixed comments local and normalized', async () => {
  let requestCount = 0;
  const result = await resolveCommentPlan(createJob(), article, async () => {
    requestCount += 1;
    return { comments: ['호출되면 안 됨'] };
  });

  assert.deepEqual(result.comments, ['첫 댓글', '둘째 댓글']);
  assert.equal(requestCount, 0);
});

test('resolveCommentPlan asks the web broker to plan generate and agent jobs', async () => {
  for (const mode of ['generate', 'agent'] as const) {
    const result = await resolveCommentPlan(createJob({ mode, fixedComments: undefined }), article, async (snapshot) => {
      assert.deepEqual(snapshot, article);
      return { comments: [`${mode} 댓글`], summary: `${mode} 계획` };
    });

    assert.deepEqual(result, { comments: [`${mode} 댓글`], summary: `${mode} 계획` });
  }
});
