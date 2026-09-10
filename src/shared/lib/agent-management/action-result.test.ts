import assert from 'node:assert/strict';
import test from 'node:test';
import { safeActionResult } from '@/shared/lib/agent-management/action-result';
import { AgentManagementError } from '@/shared/lib/agent-management/contract';

const uncertainMessage = '작업 결과를 확인하지 못했습니다. 재요청 전에 실제 결과를 확인해 주세요.';
const aggregate = (rows: unknown[], extra = {}) => ({ success: false, result: { success: false, total: rows.length, completed: 1, failed: rows.length - 1, results: rows }, ...extra });

test('known top-level action failures retain a fixed reason and optional code', () => {
  const result = safeActionResult({ success: false, error: '바이로에 다시 로그인해 주세요.' });
  assert.equal(result.errorCode, 'authentication_required');
  assert.equal(result.error, '계정 인증 확인이 필요합니다. 로그인 또는 보안 인증 상태를 확인해 주세요.');
  assert.equal(safeActionResult({ success: false, errorCode: 'captcha_required', error: 'private detail' }).errorCode, 'captcha_required');
});

test('nested failure reasons survive aggregate cleanup and replace a generic top error', () => {
  const output = safeActionResult(aggregate([
    { success: true, accountId: 'first', articleId: 123 },
    { success: false, accountId: 'second', error: '캡차 풀이 실패: password=synthetic-secret-771', password: 'synthetic-secret-771' },
  ], { error: '완료하지 못한 항목이 있습니다. 처리 결과를 확인하세요.' }));
  assert.equal(output.errorCode, 'captcha_required');
  const result = output.result as { completed: number; failed: number; results: Array<Record<string, unknown>> };
  assert.equal(result.completed, 1);
  assert.equal(result.failed, 1);
  assert.deepEqual(result.results[0], { success: true, accountId: 'first', articleId: 123 });
  assert.equal(result.results[1].errorCode, 'captcha_required');
  assert.doesNotMatch(JSON.stringify(output), /synthetic-secret|password|private detail/);
});

test('nested review flags and result_unverified codes outrank authentication failures', () => {
  for (const nested of [{ requiresReview: true, error: '로그인 실패' }, { errorCode: 'result_unverified' }]) {
    const output = safeActionResult(aggregate([{ success: false, ...nested }], { errorCode: 'authentication_required' }));
    assert.equal(output.success, false);
    assert.equal(output.requiresReview, true);
    assert.equal(output.errorCode, 'result_unverified');
    assert.equal(output.error, uncertainMessage);
    assert.doesNotMatch(output.error!, /카페/);
  }
});

test('supplied failure codes and review flags are validated at every retained level', () => {
  for (const payload of [
    { success: false, errorCode: 'secret-code' },
    aggregate([{ success: false, errorCode: { secret: true } }]),
    aggregate([{ success: false, requiresReview: 'false' }]),
    { success: true, requiresReview: 1 },
  ]) assert.throws(() => safeActionResult(payload), AgentManagementError);
});

test('successes remain compatible while nested failures cannot appear as overall success', () => {
  const success = { success: true, result: { success: true, total: 1, completed: 1, failed: 0, results: [{ success: true, articleId: 1, title: 'Title' }] } };
  assert.deepEqual(safeActionResult(success), success);
  assert.equal(safeActionResult({ success: true, result: { results: [{ success: false, error: '로그인 실패' }] } }).success, false);
});

test('double sanitization is stable for known, unknown, aggregate and uncertain failures', () => {
  for (const input of [
    { success: false, error: 'unknown password=synthetic-password-811 token=synthetic-token-901' },
    { success: false, error: '바이로에 다시 로그인해 주세요.' },
    aggregate([{ success: false, error: '캡차 풀이 실패: synthetic-secret-771' }]),
    aggregate([{ success: false, requiresReview: true, error: 'private raw stack' }]),
    { success: false, requiresReview: false, errorCode: 'login_failed' },
  ]) {
    const once = safeActionResult(input);
    assert.deepEqual(safeActionResult(once), once);
    assert.doesNotMatch(JSON.stringify(once), /synthetic-|password=|token=|private raw stack/);
  }
});
