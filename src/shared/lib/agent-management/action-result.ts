import type { ViroDesktopActionResponse } from '@/shared/types/viro-desktop';
import { AgentManagementError } from '@/shared/lib/agent-management/contract';
import { isOperationErrorCode, safeOperationFailure, type OperationErrorCode } from '@/shared/lib/agent-management/operation-failure';

const FIELDS = new Set(['success', 'result', 'total', 'completed', 'failed', 'changed', 'joined', 'alreadyMember', 'exposed', 'notExposed', 'totalManuscripts', 'totalArticles', 'results', 'jobs', 'articleId', 'articleUrl', 'originalArticleId', 'cafeId', 'cafeUrl', 'cafeName', 'accountId', 'oldNickname', 'newNickname', 'title', 'newTitle', 'folderName', 'keyword', 'status', 'rank', 'position', 'sheetSynced']);
const UNKNOWN_ERROR = '완료하지 못한 항목이 있습니다. 실행 기록과 실제 결과를 확인하세요.';
const UNCERTAIN_ERROR = '작업 결과를 확인하지 못했습니다. 재요청 전에 실제 결과를 확인해 주세요.';
interface Failure { errorCode: OperationErrorCode; error: string }
interface Cleaned { value: unknown; failure?: Failure }

const failureFor = (record: Record<string, unknown>): Failure | undefined => {
  if (record.errorCode !== undefined && !isOperationErrorCode(record.errorCode)) throw new AgentManagementError('errorCode 값이 올바르지 않습니다');
  if (record.requiresReview !== undefined && typeof record.requiresReview !== 'boolean') throw new AgentManagementError('requiresReview 값이 올바르지 않습니다');
  if (record.success !== false && record.error === undefined && record.errorCode === undefined && record.requiresReview !== true) return;
  const failure = safeOperationFailure(record.error, record.errorCode, record.requiresReview === true);
  if (failure.errorCode === 'operation_failed') failure.error = UNKNOWN_ERROR;
  if (failure.errorCode === 'result_unverified') failure.error = UNCERTAIN_ERROR;
  return failure;
};
const priority = ({ errorCode }: Failure): number => errorCode === 'result_unverified' ? 2 : errorCode === 'operation_failed' ? 0 : 1;
const selectFailure = (left?: Failure, right?: Failure): Failure | undefined =>
  !left || (right && priority(right) > priority(left)) ? right : left;

const clean = (value: unknown, depth = 0): Cleaned => {
  if (depth > 8) return { value: null };
  if (Array.isArray(value)) {
    const items = value.map((item) => clean(item, depth + 1));
    return { value: items.map((item) => item.value), failure: items.reduce<Failure | undefined>((failure, item) => selectFailure(failure, item.failure), undefined) };
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    let failure = failureFor(record);
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(record)) {
      if (!FIELDS.has(key)) continue;
      const cleaned = clean(item, depth + 1);
      result[key] = cleaned.value;
      failure = selectFailure(failure, cleaned.failure);
    }
    if (failure) {
      Object.assign(result, failure);
      if (typeof record.success === 'boolean') result.success = false;
    }
    if (record.requiresReview !== undefined || failure?.errorCode === 'result_unverified') result.requiresReview = record.requiresReview === true || failure?.errorCode === 'result_unverified';
    return { value: result, failure };
  }
  if (typeof value === 'string') return { value: value.slice(0, 1000) };
  return { value: typeof value === 'boolean' || typeof value === 'number' ? value : null };
};

/** 원격 오류 객체·계정 자격정보를 결과 조회에 저장하지 않는다. */
export const safeActionResult = (raw: unknown): ViroDesktopActionResponse => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !('success' in raw) || typeof raw.success !== 'boolean') throw new AgentManagementError('작업 결과 형식이 올바르지 않습니다');
  const cleaned = clean(raw);
  const value = cleaned.value as Record<string, unknown>;
  return { success: raw.success && !cleaned.failure,
    ...('result' in raw ? { result: value.result } : {}),
    ...(cleaned.failure || {}),
    ...(typeof value.requiresReview === 'boolean' ? { requiresReview: value.requiresReview } : {}) };
};
