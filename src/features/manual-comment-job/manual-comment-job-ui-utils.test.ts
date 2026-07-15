import assert from 'node:assert/strict';
import test from 'node:test';

import { parseSmartPaste, parseFixedComments, formatRelativeTime } from './manual-comment-job-ui-utils';

test('parseSmartPaste extracts url and numbered comment lines', () => {
  const raw = [
    'https://cafe.naver.com/babycare702/18',
    '1. 첫 번째 댓글',
    '2) 두 번째 댓글',
    '3번 세 번째 댓글',
  ].join('\n');

  const result = parseSmartPaste(raw);
  assert.equal(result.url, 'https://cafe.naver.com/babycare702/18');
  assert.deepEqual(result.comments, ['첫 번째 댓글', '두 번째 댓글', '세 번째 댓글']);
});

test('parseSmartPaste ignores lines without a leading number', () => {
  const raw = 'https://cafe.naver.com/babycare702/18\n번호 없는 줄은 무시됨';
  const result = parseSmartPaste(raw);
  assert.deepEqual(result.comments, []);
});

test('parseSmartPaste returns null url when no cafe link is present', () => {
  const result = parseSmartPaste('1. 댓글만 있음');
  assert.equal(result.url, null);
  assert.deepEqual(result.comments, ['댓글만 있음']);
});

test('parseFixedComments strips leading numbering in every supported format', () => {
  const raw = ['1. 마침표 형식', '2) 괄호 형식', '3번 번 형식', '내용만 있는 줄'].join('\n');
  assert.deepEqual(parseFixedComments(raw), ['마침표 형식', '괄호 형식', '번 형식', '내용만 있는 줄']);
});

test('parseFixedComments drops blank lines', () => {
  const raw = '1. 첫 댓글\n\n2. 둘째 댓글\n   \n';
  assert.deepEqual(parseFixedComments(raw), ['첫 댓글', '둘째 댓글']);
});

test('formatRelativeTime shows 방금 for under a minute', () => {
  const now = new Date('2026-07-15T00:00:30Z').getTime();
  assert.equal(formatRelativeTime('2026-07-15T00:00:00Z', now), '방금');
});

test('formatRelativeTime shows minutes for under an hour', () => {
  const now = new Date('2026-07-15T00:10:00Z').getTime();
  assert.equal(formatRelativeTime('2026-07-15T00:00:00Z', now), '10분 전');
});

test('formatRelativeTime shows hours for under a day', () => {
  const now = new Date('2026-07-15T05:00:00Z').getTime();
  assert.equal(formatRelativeTime('2026-07-15T00:00:00Z', now), '5시간 전');
});

test('formatRelativeTime shows days at or beyond 24 hours', () => {
  const now = new Date('2026-07-16T02:00:00Z').getTime();
  assert.equal(formatRelativeTime('2026-07-15T00:00:00Z', now), '1일 전');
});
