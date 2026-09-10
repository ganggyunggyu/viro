import { safeActionResult } from '../../src/shared/lib/agent-management/action-result';
import type { ViroDesktopAction, ViroDesktopActionResponse } from '../../src/shared/types/viro-desktop';

type Executors = {
  [Type in ViroDesktopAction['type']]: (action: Extract<ViroDesktopAction, { type: Type }>) => Promise<unknown>;
};

/** 실행 함수가 실패를 반환하면 바깥 응답도 실패다. 부분 실패를 성공으로 감싸지 않는다. */
export const dispatchDesktopAction = async (action: ViroDesktopAction, executors: Executors): Promise<ViroDesktopActionResponse> => {
  try {
    const execute = executors[action.type] as (input: ViroDesktopAction) => Promise<unknown>;
    const result = await execute(action);
    const record = result && typeof result === 'object' ? result as Record<string, unknown> : {};
    const success = record.success === true;
    return safeActionResult({ success, result, ...(!success ? { error: record.error, errorCode: record.errorCode, requiresReview: record.requiresReview } : {}) });
  } catch (error) {
    return safeActionResult({ success: false, error: error instanceof Error ? error.message : undefined });
  }
};
