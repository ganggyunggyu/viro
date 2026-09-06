import assert from 'node:assert/strict';
import test from 'node:test';

import { isNicknameEquivalent, isVerifiedNewComment, resolveCommenterNickname } from './comment-writer-utils';

test('isNicknameEquivalent ignores whitespace differences', () => {
  assert.equal(isNicknameEquivalent('오늘도즐겁게', '오늘도 즐겁게'), true);
});

test('isNicknameEquivalent keeps mismatched nicknames distinct', () => {
  assert.equal(isNicknameEquivalent('오늘도즐겁게', '하준리뷰'), false);
});

test('strict confirmation requires a new numeric ID, full content, and exact own nickname', () => {
  const expected = { content: '같은 앞부분이어도 전체 내용이 달라질 수 있습니다', nickname: '작성자', previousIds: new Set(['10']) };
  const written = { id: '11', content: expected.content, nickname: '작성자' };
  assert.equal(isVerifiedNewComment(written, expected), true);
  assert.equal(isVerifiedNewComment({ ...written, id: '10' }, expected), false);
  assert.equal(isVerifiedNewComment({ ...written, id: undefined }, expected), false);
  assert.equal(isVerifiedNewComment({ ...written, nickname: '다른작성자' }, expected), false);
  assert.equal(isVerifiedNewComment({ ...written, nickname: '' }, expected), false);
  assert.equal(isVerifiedNewComment({ ...written, content: `${expected.content} 다른 내용` }, expected), false);
});

test('strict author identity uses the cafe composer even when the registration label differs', () => {
  const nickname = resolveCommenterNickname({ strict: true, composerNickname: '실제 카페별명', storedNickname: '운영팀 3번 계정', accountId: 'naver123' });
  assert.equal(nickname, '실제 카페별명');
  assert.equal(isVerifiedNewComment({ id: '12', nickname: '실제 카페별명', content: '전체 댓글' }, { nickname, content: '전체 댓글', previousIds: new Set(['10']) }), true);
  assert.equal(resolveCommenterNickname({ strict: true, storedNickname: '운영팀 3번 계정', accountId: 'naver123' }), '');
  assert.equal(resolveCommenterNickname({ strict: false, storedNickname: '운영팀 3번 계정', accountId: 'naver123' }), '운영팀 3번 계정');
});
