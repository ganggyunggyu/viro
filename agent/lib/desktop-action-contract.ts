import type { ViroDesktopAction } from '../../src/shared/types/viro-desktop';

export const validateDesktopAction = (value: unknown): ViroDesktopAction => {
  if (!value || typeof value !== 'object') {
    throw new Error('실행 정보가 올바르지 않습니다');
  }

  const action = value as Partial<ViroDesktopAction>;
  if (typeof action.type !== 'string') {
    throw new Error('실행 종류가 없습니다');
  }

  if (action.type === 'account-login' && !action.accountId) {
    throw new Error('계정을 선택하세요');
  }
  if (action.type === 'nickname-change') {
    if (action.mode === 'by-cafe' && !action.cafeId) throw new Error('카페를 선택하세요');
    if (action.mode === 'by-account' && !action.accountId) throw new Error('계정을 선택하세요');
  }
  if (action.type === 'exposure-check' && (!action.accountId || !Array.isArray(action.items))) {
    throw new Error('노출 확인 입력이 올바르지 않습니다');
  }
  if (action.type === 'cafe-create' && !action.input?.ownerAccountId) {
    throw new Error('카페 소유 계정을 선택하세요');
  }
  if ((action.type === 'manual-publish' || action.type === 'manual-modify') &&
      !Array.isArray(action.input?.manuscripts)) {
    throw new Error('발행할 원고가 없습니다');
  }
  if (action.type === 'rewrite' && action.input?.cafeIds.length === 0) {
    throw new Error('재작성할 카페를 선택하세요');
  }

  const supported = new Set([
    'account-login',
    'cafe-join-all',
    'nickname-change',
    'exposure-check',
    'cafe-create',
    'manual-publish',
    'manual-modify',
    'rewrite',
  ]);
  if (!supported.has(action.type)) {
    throw new Error(`지원하지 않는 로컬 실행: ${action.type}`);
  }

  return action as ViroDesktopAction;
};
