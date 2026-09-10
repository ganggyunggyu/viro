import { AsyncLocalStorage } from 'node:async_hooks';

const scope = new AsyncLocalStorage<() => boolean>();
export const assertBrowserExecutionAllowed = (): void => {
  if (scope.getStore()?.() === false) throw new Error('브라우저 작업 실행 권한을 확인하지 못했습니다.');
};
export const withBrowserExecutionGuard = <T>(allowed: () => boolean, run: () => Promise<T>): Promise<T> => scope.run(allowed, run);
