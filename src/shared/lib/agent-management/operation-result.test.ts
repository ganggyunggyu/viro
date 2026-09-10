import assert from 'node:assert/strict';
import test from 'node:test';
import { parseOperationResult } from '@/shared/lib/agent-management/contract';
import { AgentOperation } from '@/shared/models/agent-operation';
import { toOperationView } from '@/shared/lib/agent-management/operations';
import { EmbeddedWorkerError } from '../../../../agent/embedded/errors';

test('operation failures preserve distinct safe reasons, including the scheduler authentication message', () => {
  const cases = [
    ['캡차 풀이 실패 (1회 시도): private provider detail', 'captcha_required'],
    [new EmbeddedWorkerError('authentication_required').message, 'authentication_required'],
    ['아이디 보호/해제 페이지로 이동', 'additional_authentication_required'],
    ['로그인 대기 시간 초과. 추가 인증 여부를 확인해주세요.', 'additional_authentication_required'],
    ['세션 만료 후 재로그인 실패: private details', 'login_failed'],
    ['댓글 작성 권한이 없습니다.', 'comment_permission_denied'],
    ['ARTICLE_NOT_READY:댓글 입력창을 찾을 수 없습니다.', 'article_unavailable'],
    ['게시글 본문을 찾을 수 없습니다.', 'article_unavailable'],
    ['글쓴이 본인 계정으로는 댓글 작성 불가 (작성자 닉네임: private nickname)', 'self_comment_forbidden'],
    ['댓글이 등록되지 않음 (닉네임+내용 매칭 실패)', 'result_unverified'],
    ['unrecognized upstream failure', 'operation_failed'],
  ];
  for (const [error, expected] of cases) assert.equal(parseOperationResult({ success: false, error }).errorCode, expected);
});

test('operation failure responses never reflect raw errors, passwords, tokens or nicknames', () => {
  for (const prefix of ['캡차 풀이 실패', '로그인 실패', '댓글 작성 권한이 없습니다', 'unknown']) {
    const result = parseOperationResult({ success: false, error: `${prefix}: password=synthetic-password-918 token=synthetic-token-672 작성자=private-nickname-552` });
    assert.ok(result.error);
    assert.doesNotMatch(JSON.stringify(result), /synthetic-|private-nickname|password=|token=/);
  }
});

test('uncertain writes take precedence over a nested authentication failure', () => {
  const result = parseOperationResult({ success: false, requiresReview: true, error: '댓글 검증 재진입 실패: 재로그인 실패' });
  assert.equal(result.errorCode, 'result_unverified');
  assert.equal(result.requiresReview, true);
  assert.equal(parseOperationResult({ success: false, error: '댓글 작성창에서 로그인한 계정의 카페 별명을 확인하지 못했습니다. 댓글을 등록하지 않았습니다.' }).errorCode, 'operation_failed');
});

test('explicit failure codes are strict and select fixed text while legacy success results remain compatible', () => {
  const result = parseOperationResult({ success: false, errorCode: 'authentication_required', error: 'private upstream details' });
  assert.equal(result.errorCode, 'authentication_required');
  assert.doesNotMatch(result.error!, /private/);
  assert.throws(() => parseOperationResult({ success: false, errorCode: 'anything-secret' }));
  assert.throws(() => parseOperationResult({ success: false, errorCode: { nested: 'secret' } }));
  assert.throws(() => parseOperationResult({ success: true, errorCode: 'authentication_required' }));
  assert.deepEqual(parseOperationResult({ success: true, commentId: '123' }), { success: true, commentId: '123' });
  assert.deepEqual(parseOperationResult({ success: false }), { success: false });
});

test('operation schema and public view preserve only an allowed error code and its fixed message', () => {
  const result = parseOperationResult({ success: false, error: '캡차 풀이 실패: sensitive suffix' });
  const input = { userId: 'owner', fingerprint: 'test', type: 'write_comment', accountId: 'test', cafeId: '123', articleId: 1, content: 'test', createdAt: new Date(), updatedAt: new Date() };
  const doc = new AgentOperation({ ...input, result });
  assert.equal(doc.validateSync(), undefined);
  assert.equal(doc.result?.errorCode, 'captcha_required');
  assert.equal(toOperationView(doc).result?.errorCode, 'captcha_required');
  assert.equal(toOperationView(doc).result?.error, result.error);
  const legacy = new AgentOperation({ ...input, result: { success: false, error: 'unknown password=synthetic-password-918' } });
  assert.doesNotMatch(JSON.stringify(toOperationView(legacy)), /synthetic-password|password=/);
  assert.ok(new AgentOperation({ ...input, result: { success: false, errorCode: 'not_allowed' } }).validateSync());
});
