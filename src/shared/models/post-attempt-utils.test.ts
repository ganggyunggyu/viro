import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAttemptKey } from './post-attempt-utils';

test('buildAttemptKey combines cafe, account, keyword and KST date', () => {
  const nowMs = new Date('2026-07-20T01:06:31.590Z').getTime(); // 2026-07-20 10:06:31 KST
  const key = buildAttemptKey('31750114', 'compare14310', '인천웨딩홀 부평 지역 비교 기준과 선택 포인트', nowMs);
  assert.equal(key, '31750114:compare14310:인천웨딩홀 부평 지역 비교 기준과 선택 포인트:2026-07-20');
});

test('buildAttemptKey is identical for retries minutes apart on the same KST day', () => {
  const first = buildAttemptKey('31750114', 'compare14310', '키워드', new Date('2026-07-20T01:06:00.000Z').getTime());
  const secondRetry = buildAttemptKey('31750114', 'compare14310', '키워드', new Date('2026-07-20T01:26:00.000Z').getTime());
  assert.equal(first, secondRetry);
});

test('buildAttemptKey differs once KST date rolls over', () => {
  // 23:59 KST on 07-19 vs 00:01 KST on 07-20
  const beforeMidnight = buildAttemptKey('31750114', 'compare14310', '키워드', new Date('2026-07-19T14:59:00.000Z').getTime());
  const afterMidnight = buildAttemptKey('31750114', 'compare14310', '키워드', new Date('2026-07-19T15:01:00.000Z').getTime());
  assert.notEqual(beforeMidnight, afterMidnight);
});

test('buildAttemptKey differs when cafeId, account, or keyword differ', () => {
  const nowMs = new Date('2026-07-20T01:06:00.000Z').getTime();
  const base = buildAttemptKey('31750114', 'compare14310', '키워드', nowMs);
  assert.notEqual(base, buildAttemptKey('99999999', 'compare14310', '키워드', nowMs));
  assert.notEqual(base, buildAttemptKey('31750114', 'other-account', '키워드', nowMs));
  assert.notEqual(base, buildAttemptKey('31750114', 'compare14310', '다른키워드', nowMs));
});
