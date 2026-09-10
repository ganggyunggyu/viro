import type { ViroDesktopAction, ViroDesktopActionResponse } from '../../src/shared/types/viro-desktop';
import { safeActionResult } from '../../src/shared/lib/agent-management/action-result';

interface Dependencies {
  heartbeat: () => Promise<boolean>;
  execute: (action: ViroDesktopAction) => Promise<ViroDesktopActionResponse>;
  report: (result: ViroDesktopActionResponse, uncertain: boolean) => Promise<boolean>;
}

const CLEAR_LOGIN_FAILURES = new Set(['captcha_required', 'authentication_required', 'additional_authentication_required', 'login_failed', 'resource_not_found', 'preparation_failed']);

export const processActionTask = async (action: ViroDesktopAction, dependencies: Dependencies) => {
  if (!await dependencies.heartbeat()) throw new Error('작업 실행 권한을 확인하지 못했습니다');
  let result: ViroDesktopActionResponse;
  try { result = await dependencies.execute(action); }
  catch (error) { result = { success: false, error: error instanceof Error ? error.message : undefined }; }
  const safe = safeActionResult(result);
  const clearLoginFailure = action.type === 'account-login' && CLEAR_LOGIN_FAILURES.has(safe.errorCode ?? '') && !safe.requiresReview;
  const uncertain = safe.requiresReview === true || (!safe.success && !clearLoginFailure);
  if (!await dependencies.report(safe, uncertain)) throw new Error('결과 저장을 확인하지 못했습니다');
};
