import { CAPTCHA_SERVICE_MESSAGES } from '@/shared/lib/captcha-service-error';
export const OPERATION_ERROR_CODES = [
  'captcha_required', 'authentication_required', 'additional_authentication_required', 'login_failed',
  'comment_permission_denied', 'article_unavailable', 'self_comment_forbidden', 'result_unverified',
  'resource_not_found', 'preparation_failed', 'operation_failed',
  'captcha_service_authentication_required', 'captcha_service_unavailable', 'captcha_service_invalid_response',
] as const;
export type OperationErrorCode = typeof OPERATION_ERROR_CODES[number];

const messages: Record<OperationErrorCode, string> = {
  ...CAPTCHA_SERVICE_MESSAGES,
  captcha_required: '보안문자 인증을 완료하지 못해 작업을 중단했습니다.',
  authentication_required: '계정 인증 확인이 필요합니다. 로그인 또는 보안 인증 상태를 확인해 주세요.',
  additional_authentication_required: '네이버 로그인에 추가 확인이 필요할 수 있습니다. 보호조치나 보안 인증 상태를 확인해 주세요.',
  login_failed: '네이버 계정에 로그인하지 못했습니다. 계정 정보와 로그인 상태를 확인해 주세요.',
  comment_permission_denied: '이 계정으로 댓글을 작성할 수 없습니다. 카페 가입 상태와 작성 권한을 확인해 주세요.',
  article_unavailable: '게시글이나 댓글 입력창을 확인하지 못했습니다. 글 상태와 접근 권한을 확인해 주세요.',
  self_comment_forbidden: '글을 작성한 계정으로는 댓글을 달 수 없습니다. 다른 계정을 선택해 주세요.',
  result_unverified: '작업 결과를 확인하지 못했습니다. 재요청 전에 카페에서 실제 결과를 확인해 주세요.',
  resource_not_found: '등록된 계정 또는 카페를 찾을 수 없습니다.',
  preparation_failed: '작업 실행 준비에 실패했습니다. 서버 상태를 확인해 주세요.',
  operation_failed: '작업을 완료하지 못했습니다. 실제 결과를 확인하세요.',
};

export const isOperationErrorCode = (value: unknown): value is OperationErrorCode =>
  typeof value === 'string' && OPERATION_ERROR_CODES.includes(value as OperationErrorCode);

const classify = (error: string): OperationErrorCode => {
  for (const [code, message] of Object.entries(CAPTCHA_SERVICE_MESSAGES)) {
    if (error.includes(message) || error.includes(code)) return code as OperationErrorCode;
  }
  if (/댓글 검증 재진입 실패|댓글(?:이)? 등록되지 않음|대댓글이 등록되지 않음|댓글 등록 결과를 확인하지 못|(?:가입 상태|가입 완료)를 확인할 회원 정보가 없|실제 카페 결과를 확인|작업 실행 여부를 확인할 수 없|(?:서버|워커)(?:의)? 응답이 끊|동기화 결과 확인이 필요/.test(error)) return 'result_unverified';
  if (/captcha|캡차|보안문자/i.test(error)) return 'captcha_required';
  if (/\bauthentication_required\b|바이로에 다시 로그인해 주세요\./.test(error)) return 'authentication_required';
  if (/추가 인증|2단계 인증|아이디 보호\/해제|로그인 후 보호\/휴면 해제|보호조치/.test(error)) return 'additional_authentication_required';
  if (/글쓴이 본인 계정으로는 댓글 작성 불가|자신이 작성한 글에는 댓글|본인 글에는 댓글/.test(error)) return 'self_comment_forbidden';
  if (/댓글 (?:작성 )?권한이 없|댓글을 작성할 수 없|댓글 작성이 (?:제한|금지)|댓글은 .*회원만/.test(error)) return 'comment_permission_denied';
  if (/ARTICLE_NOT_READY:|게시글 본문을 찾을 수 없|본문이 없|삭제된 게시글|존재하지 않는 게시글/.test(error)) return 'article_unavailable';
  if (/로그인 실패|재로그인 실패|재로그인 후에도 로그인 페이지로 리다이렉트|아이디 또는 비밀번호/.test(error)) return 'login_failed';
  if (error.includes('등록된 계정 또는 카페를 찾을 수 없습니다')) return 'resource_not_found';
  if (error.includes('작업 실행 준비에 실패했습니다')) return 'preparation_failed';
  return 'operation_failed';
};

/** Only enum codes and fixed copy leave this boundary; raw errors are never returned. */
export const safeOperationFailure = (error: unknown, suppliedCode?: unknown, requiresReview = false): { errorCode: OperationErrorCode; error: string } => {
  const errorCode = requiresReview ? 'result_unverified'
    : isOperationErrorCode(suppliedCode) ? suppliedCode : classify(typeof error === 'string' ? error : '');
  return { errorCode, error: messages[errorCode] };
};
