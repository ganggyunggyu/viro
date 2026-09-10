import type { CommentAccount } from '../lib/broker-client';
import type { NaverAccount } from '../../src/shared/lib/account-manager';

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const toAccount = (account: CommentAccount): NaverAccount => ({
  id: account.accountId,
  password: account.password,
  nickname: account.nickname || account.accountId,
  isMain: account.isMain,
  role: account.role,
  excludeFromAutoComment: account.excludeFromAutoComment,
});

