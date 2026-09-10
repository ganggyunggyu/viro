import { safeActionResult } from '../src/shared/lib/agent-management/action-result';
import { loginAccount } from '../src/shared/lib/multi-session';
import { validateDesktopAction } from './lib/desktop-action-contract';
import type { BrokerClient } from './lib/broker-client';
import { dispatchDesktopAction } from './lib/desktop-action-dispatch';
import { executeJoinAll } from './actions/join';
import { executeNicknameChange } from './actions/nickname';
import { executeExposureCheck } from './actions/exposure';
import { executeCafeCreate } from './actions/cafe-create';
import { executeManualPublish } from './actions/publish';
import { executeManualModify } from './actions/modify';
import { executeRewrite } from './actions/rewrite';

export const executeDesktopAction = async (value: unknown, broker: BrokerClient) => {
  try {
    return await dispatchDesktopAction(validateDesktopAction(value), {
      'account-login': async ({ accountId }) => {
        const { accounts } = await broker.context();
        const account = accounts.find((item) => item.accountId === accountId);
        if (!account) return { success: false, errorCode: 'resource_not_found' };
        return loginAccount(account.accountId, account.password, { reason: 'desktop_account_check' });
      },
      'cafe-join-all': async () => executeJoinAll(broker),
      'nickname-change': async (action) => executeNicknameChange(broker, action),
      'exposure-check': async (action) => executeExposureCheck(broker, action),
      'cafe-create': async (action) => executeCafeCreate(broker, action),
      'manual-publish': async (action) => executeManualPublish(broker, action),
      'manual-modify': async (action) => executeManualModify(broker, action),
      rewrite: async (action) => executeRewrite(broker, action),
    });
  } catch (error) {
    return safeActionResult({ success: false, error: error instanceof Error ? error.message : undefined });
  }
};
