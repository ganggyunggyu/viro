import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  JOB_LIST_DEFAULT_LIMIT,
  JOB_LIST_MAX_LIMIT,
  buildJobListFilter,
  clampJobLimit,
  isJobStatus,
} from './job-queries';

test('clampJobLimit: 값이 없거나 이상하면 기본값', () => {
  assert.equal(clampJobLimit(undefined), JOB_LIST_DEFAULT_LIMIT);
  assert.equal(clampJobLimit(''), JOB_LIST_DEFAULT_LIMIT);
  assert.equal(clampJobLimit('abc'), JOB_LIST_DEFAULT_LIMIT);
  assert.equal(clampJobLimit(0), JOB_LIST_DEFAULT_LIMIT);
  assert.equal(clampJobLimit(-5), JOB_LIST_DEFAULT_LIMIT);
});

test('clampJobLimit: 상한을 넘기면 상한으로 자른다', () => {
  assert.equal(clampJobLimit(9999), JOB_LIST_MAX_LIMIT);
  assert.equal(clampJobLimit('20'), 20);
  assert.equal(clampJobLimit(7.9), 7);
});

test('isJobStatus: cancelled 를 포함한 다섯 가지만 통과', () => {
  for (const status of ['pending', 'running', 'done', 'failed', 'cancelled']) {
    assert.equal(isJobStatus(status), true, status);
  }
  assert.equal(isJobStatus('queued'), false);
  assert.equal(isJobStatus(''), false);
  assert.equal(isJobStatus(undefined), false);
});

test('buildJobListFilter: userId 는 항상 들어간다', () => {
  assert.deepEqual(buildJobListFilter('u1'), { userId: 'u1' });
});

test('buildJobListFilter: 모르는 status 는 조건에서 뺀다', () => {
  assert.deepEqual(buildJobListFilter('u1', { status: 'queued' }), { userId: 'u1' });
  assert.deepEqual(buildJobListFilter('u1', { status: 'done' }), { userId: 'u1', status: 'done' });
});

test('buildJobListFilter: cafeId 는 공백을 털고 빈 값이면 뺀다', () => {
  assert.deepEqual(buildJobListFilter('u1', { cafeId: '  31750099 ' }), {
    userId: 'u1',
    cafeId: '31750099',
  });
  assert.deepEqual(buildJobListFilter('u1', { cafeId: '   ' }), { userId: 'u1' });
});
