import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCafeCommentBatchPrompt } from './cafe-comment-batch-api';

test('buildCafeCommentBatchPrompt uses only the keyword and the neutral comment style', () => {
  const prompt = buildCafeCommentBatchPrompt({
    keyword: '강남 맛집',
    exactCount: 5,
  });

  assert.match(prompt, /강남 맛집/);
  assert.match(prompt, /좋은 정보 감사합니다/);
  assert.match(prompt, /제가 가본 곳도 좋았는데 소개해주신 곳도 좋아 보이네요/);
  assert.doesNotMatch(prompt, /글 본문/);
  assert.doesNotMatch(prompt, /페르소나 분산/);
});
