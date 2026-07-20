import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractCafeMemberCount,
  sanitizeCafeNickname,
  toCafeSlug,
} from './index';

test('sanitizeCafeNickname removes unsupported characters, caps length, and uses a safe fallback', () => {
  assert.equal(sanitizeCafeNickname(' 카페_회원!123 ', 'fallback'), '카페회원123');
  assert.equal(sanitizeCafeNickname('abcdefghijklmnopqrstuvwxyz', 'fallback'), 'abcdefghijklmnopqrst');
  assert.equal(sanitizeCafeNickname('***', ' 대체_회원 '), '대체회원');
  assert.equal(sanitizeCafeNickname('***', '---'), '회원');
});

test('extractCafeMemberCount accepts current member-count text shapes and comma separators', () => {
  assert.equal(extractCafeMemberCount('카페멤버수\n12,345'), 12345);
  assert.equal(extractCafeMemberCount('멤버 987명'), 987);
  assert.equal(extractCafeMemberCount('회원 정보 없음'), null);
});

test('toCafeSlug accepts slugs and Cafe URLs while rejecting ca-fe routes', () => {
  assert.equal(toCafeSlug('  test-cafe  '), 'test-cafe');
  assert.equal(toCafeSlug('https://cafe.naver.com/test-cafe/123'), 'test-cafe');
  assert.equal(toCafeSlug('https://cafe.naver.com/ca-fe/cafes/123'), undefined);
  assert.equal(toCafeSlug('  '), undefined);
});
