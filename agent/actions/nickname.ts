import type { BrokerClient } from '../lib/broker-client';
import type { ViroDesktopAction } from '../../src/shared/types/viro-desktop';
import { changeByAccount, changeByCafe, type BatchNicknameResult } from '../../src/features/auto-comment/batch/nickname-changer';
import type { CafeConfig } from '../../src/shared/config/cafes';
import { toAccount } from './shared';

const mergeNicknameResults = (results: BatchNicknameResult[]): BatchNicknameResult => {
  const rows = results.flatMap(({ results: items }) => items);
  const changed = rows.filter(({ success }) => success).length;
  return {
    success: rows.length > 0 && changed === rows.length,
    total: rows.length,
    changed,
    failed: rows.length - changed,
    results: rows,
  };
};

export const executeNicknameChange = async (
  broker: BrokerClient,
  action: Extract<ViroDesktopAction, { type: 'nickname-change' }>,
): Promise<BatchNicknameResult> => {
  const context = await broker.context();
  const accounts = context.accounts.map(toAccount);
  const cafes = context.cafes as CafeConfig[];

  if (action.mode === 'by-cafe') {
    const cafe = cafes.find(({ cafeId }) => cafeId === action.cafeId);
    if (!cafe) throw new Error('카페를 찾을 수 없습니다');
    return changeByCafe(accounts, cafe);
  }
  if (action.mode === 'by-account') {
    const account = accounts.find(({ id }) => id === action.accountId);
    if (!account) throw new Error('계정을 찾을 수 없습니다');
    return changeByAccount(account, cafes);
  }

  const batches: BatchNicknameResult[] = [];
  for (const cafe of cafes) {
    batches.push(await changeByCafe(accounts, cafe));
  }
  return mergeNicknameResults(batches);
};

