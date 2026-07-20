import type { ViroDesktopAction } from '@/shared/types/viro-desktop';

export const runDesktopAction = async <T>(action: ViroDesktopAction): Promise<T> => {
  const bridge = window.viroDesktop;
  if (!bridge) {
    throw new Error('이 기능은 Viro 데스크톱 프로그램에서 실행하세요');
  }

  const response = await bridge.executeAction<T>(action);
  if (!response.success || response.result === undefined) {
    throw new Error(response.error || '로컬 실행 실패');
  }
  return response.result;
};
