import { createHash } from 'node:crypto';
import { isOperationErrorCode, safeOperationFailure, type OperationErrorCode } from '@/shared/lib/agent-management/operation-failure';

export class AgentManagementError extends Error {
  constructor(message: string, public status = 400, public code = 'invalid_request') {
    super(message);
    this.name = 'AgentManagementError';
  }
}

export const objectBody = (input: unknown, allowed: readonly string[]): Record<string, unknown> => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AgentManagementError('JSON 객체를 입력하세요');
  }
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    throw new AgentManagementError('지원하지 않는 필드가 포함되어 있습니다');
  }
  return body;
};

export const textField = (value: unknown, name: string, max = 100): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new AgentManagementError(`${name} 값이 올바르지 않습니다`);
  }
  return value.trim();
};

const numericId = (value: unknown, name: string): string => {
  const id = textField(typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : value, name, 20);
  if (!/^[1-9]\d*$/.test(id)) throw new AgentManagementError(`${name}는 숫자 ID여야 합니다`);
  return id;
};

const accountIdField = (value: unknown): string => {
  const id = textField(value, 'accountId', 64);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(id)) throw new AgentManagementError('accountId 값이 올바르지 않습니다');
  return id;
};

export const parseAccountRegistration = (input: unknown) => {
  const body = objectBody(input, ['accountId', 'password', 'nickname', 'role']);
  const accountId = accountIdField(body.accountId);
  textField(body.password, 'password', 1024);
  if (body.role !== undefined && body.role !== 'writer' && body.role !== 'commenter') {
    throw new AgentManagementError('role은 writer 또는 commenter여야 합니다');
  }
  return {
    accountId,
    password: body.password as string,
    ...(body.nickname !== undefined ? { nickname: textField(body.nickname, 'nickname', 100) } : {}),
    role: (body.role ?? 'commenter') as 'writer' | 'commenter',
  };
};

export const parseCafeRegistration = (input: unknown) => {
  const body = objectBody(input, ['cafeId', 'cafeUrl', 'name', 'menuId']);
  let cafeUrl = textField(body.cafeUrl, 'cafeUrl', 300);
  if (cafeUrl.includes('://')) {
    let url: URL;
    try { url = new URL(cafeUrl); } catch { throw new AgentManagementError('카페 URL이 올바르지 않습니다'); }
    if (url.protocol !== 'https:' || url.hostname !== 'cafe.naver.com' || url.port || url.username || url.password || url.search || url.hash) {
      throw new AgentManagementError('https://cafe.naver.com/카페주소 형식으로 입력하세요');
    }
    cafeUrl = url.pathname.replace(/^\/|\/$/g, '');
  }
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(cafeUrl)) throw new AgentManagementError('카페 주소가 올바르지 않습니다');
  return { cafeId: numericId(body.cafeId, 'cafeId'), cafeUrl, name: textField(body.name, 'name'), menuId: numericId(body.menuId, 'menuId') };
};

export interface AgentOperationInput {
  type: 'join_cafe' | 'write_comment';
  accountId: string;
  cafeId: string;
  articleId?: number;
  content?: string;
  nickname?: string;
}

export type AgentOperationStatus = 'pending' | 'running' | 'done' | 'failed' | 'needs_review';
export interface AgentOperationResult {
  success: boolean;
  requiresReview?: boolean;
  commentId?: string;
  membershipStatus?: 'joined' | 'alreadyMember' | 'pending' | 'failed';
  error?: string;
  errorCode?: OperationErrorCode;
}
export interface AgentOperationView extends AgentOperationInput {
  executionTarget?: 'scheduler';
  id: string;
  status: AgentOperationStatus;
  result?: AgentOperationResult;
  createdAt: string;
  updatedAt: string;
}

export const parseOperation = (input: unknown): AgentOperationInput => {
  const body = objectBody(input, ['type', 'accountId', 'cafeId', 'articleId', 'content', 'nickname']);
  const accountId = accountIdField(body.accountId);
  const cafeId = numericId(body.cafeId, 'cafeId');
  if (body.type === 'join_cafe') {
    if (body.articleId !== undefined || body.content !== undefined) throw new AgentManagementError('카페 가입에는 글이나 댓글을 지정할 수 없습니다');
    return { type: 'join_cafe', accountId, cafeId, ...(body.nickname !== undefined ? { nickname: textField(body.nickname, 'nickname', 30) } : {}) };
  }
  if (body.type !== 'write_comment' || !Number.isSafeInteger(body.articleId) || Number(body.articleId) < 1 || body.nickname !== undefined) {
    throw new AgentManagementError('작업 유형 또는 articleId 값이 올바르지 않습니다');
  }
  return { type: 'write_comment', accountId, cafeId, articleId: Number(body.articleId), content: textField(body.content, 'content', 3000) };
};

export const operationIdentity = (userId: string, key: unknown, input: AgentOperationInput) => {
  const idempotencyKey = textField(key, 'Idempotency-Key', 128);
  if (!/^[a-zA-Z0-9._-]+$/.test(idempotencyKey)) throw new AgentManagementError('Idempotency-Key 값이 올바르지 않습니다');
  const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  return { id: hash([userId, idempotencyKey]).slice(0, 24), fingerprint: hash(parseOperation(input)) };
};

export const toSafeAccount = <T extends {
  accountId: string; password?: string; nickname?: string; role?: string; isActive?: boolean;
}>(account: T) => ({
  accountId: account.accountId, nickname: account.nickname, role: account.role,
  isActive: account.isActive === true, hasPassword: Boolean(account.password),
});

export const parseOperationId = (value: unknown): string => {
  const id = textField(value, 'operationId', 24);
  if (!/^[a-f\d]{24}$/.test(id)) throw new AgentManagementError('operationId 값이 올바르지 않습니다');
  return id;
};

export const parseOperationResult = (input: unknown): AgentOperationResult => {
  const body = objectBody(input, ['success', 'requiresReview', 'commentId', 'membershipStatus', 'error', 'errorCode']);
  if (typeof body.success !== 'boolean') throw new AgentManagementError('success 값이 올바르지 않습니다');
  if (body.requiresReview !== undefined && (typeof body.requiresReview !== 'boolean' || (body.requiresReview && body.success))) throw new AgentManagementError('requiresReview 값이 올바르지 않습니다');
  if (body.errorCode !== undefined && (!isOperationErrorCode(body.errorCode) || body.success)) throw new AgentManagementError('errorCode 값이 올바르지 않습니다');
  if (body.membershipStatus !== undefined && !['joined', 'alreadyMember', 'pending', 'failed'].includes(String(body.membershipStatus))) {
    throw new AgentManagementError('membershipStatus 값이 올바르지 않습니다');
  }
  return {
    success: body.success,
    ...(body.requiresReview === true ? { requiresReview: true } : {}),
    ...(body.commentId !== undefined ? { commentId: numericId(body.commentId, 'commentId') } : {}),
    ...(body.membershipStatus !== undefined ? { membershipStatus: body.membershipStatus as AgentOperationResult['membershipStatus'] } : {}),
    ...(body.error !== undefined || body.errorCode !== undefined ? safeOperationFailure(body.error !== undefined ? textField(body.error, 'error', 500) : undefined, body.errorCode, body.requiresReview === true) : {}),
  };
};
