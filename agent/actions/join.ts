import { joinCafeWithNicknameRetry } from '../../src/features/auto-comment/batch/cafe-join';
import { toAccount, sleep } from './shared';
import type { BrokerClient } from '../lib/broker-client';

export const executeJoinAll = async (broker: BrokerClient): Promise<unknown> => {
  const { accounts, cafes } = await broker.context();
  const results: Array<{
    success: boolean;
    accountId: string;
    cafeName: string;
    alreadyMember?: boolean;
    error?: string;
  }> = [];
  let joined = 0;
  let alreadyMember = 0;
  let failed = 0;

  for (const account of accounts) {
    for (const cafe of cafes) {
      const result = await joinCafeWithNicknameRetry(toAccount(account), cafe.cafeId, {
        cafeUrl: cafe.cafeUrl,
        updateDbNickname: async (nickname) => {
          await broker.sync('nickname', { accountId: account.accountId, nickname });
        },
      });
      results.push({ ...result, cafeName: cafe.name });
      if (result.alreadyMember) alreadyMember += 1;
      else if (result.success) joined += 1;
      else failed += 1;
      await sleep(3000);
    }
  }

  return {
    success: results.length > 0 && failed === 0,
    total: accounts.length * cafes.length,
    joined,
    alreadyMember,
    failed,
    results,
  };
};

