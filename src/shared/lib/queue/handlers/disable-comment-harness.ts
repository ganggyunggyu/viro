import type { NaverAccount } from '@/shared/lib/account-manager';
import type { DisableCommentJobData, JobResult } from '../types';

export interface DisableCommentJobHandlerContext {
  account: NaverAccount;
}

export interface DisableCommentRunResult extends JobResult {
  alreadyDisabled?: boolean;
}

export interface DisableCommentJobHandlerDeps {
  acquireLock: (accountId: string) => Promise<void>;
  releaseLock: (accountId: string) => void;
  ensureLoggedIn: (
    account: NaverAccount,
  ) => Promise<{ success: true } | { success: false; error?: string }>;
  runDisable: (
    data: DisableCommentJobData,
    account: NaverAccount,
  ) => Promise<DisableCommentRunResult>;
}

export const createDisableCommentJobHandler = ({
  acquireLock,
  releaseLock,
  ensureLoggedIn,
  runDisable,
}: DisableCommentJobHandlerDeps) => {
  return async (
    data: DisableCommentJobData,
    ctx: DisableCommentJobHandlerContext,
  ): Promise<JobResult> => {
    const { account } = ctx;
    await acquireLock(account.id);

    try {
      const login = await ensureLoggedIn(account);
      if (!login.success) {
        return { success: false, error: `로그인 실패: ${login.error}` };
      }

      const { alreadyDisabled, ...result } = await runDisable(data, account);
      void alreadyDisabled;
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    } finally {
      releaseLock(account.id);
    }
  };
};
