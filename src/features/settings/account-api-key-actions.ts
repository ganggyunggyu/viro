'use server';

import { connectDB } from '@/shared/lib/mongodb';
import { getCurrentUserId } from '@/shared/config/user';
import { Account } from '@/shared/models/account';
import { testAccountKey, type TestKeyResult } from '@/features/settings/account-api-key-test';

export type ApiKeyProvider = 'gemini' | 'deepseek';
export type { TestKeyResult } from '@/features/settings/account-api-key-test';
export interface AccountApiKeyStatus {
  hasGemini: boolean;
  geminiMasked: string | null;
  hasDeepseek: boolean;
  deepseekMasked: string | null;
}

const ownedAccount = async (accountId: string) => {
  const userId = await getCurrentUserId();
  if (typeof accountId !== 'string' || !accountId.trim()) throw new Error('계정을 확인하세요.');
  await connectDB();
  return { userId, accountId, isActive: true };
};
const readKeys = async (filter: Awaited<ReturnType<typeof ownedAccount>>) => {
  const account = await Account.findOne(filter).select('apiKeys').lean();
  if (!account) throw new Error('계정을 찾을 수 없습니다.');
  return account.apiKeys;
};
const requireProvider = (provider: ApiKeyProvider) => {
  if (provider !== 'gemini' && provider !== 'deepseek') throw new Error('지원하지 않는 API 키입니다.');
};
const statusFor = (keys: Awaited<ReturnType<typeof readKeys>>): AccountApiKeyStatus => ({
  hasGemini: Boolean(keys?.gemini), geminiMasked: keys?.gemini ? '등록됨' : null,
  hasDeepseek: Boolean(keys?.deepseek), deepseekMasked: keys?.deepseek ? '등록됨' : null,
});

export const getAccountApiKeyStatusAction = async (accountId: string): Promise<AccountApiKeyStatus> =>
  statusFor(await readKeys(await ownedAccount(accountId)));

export const updateAccountApiKeyAction = async (accountId: string, provider: ApiKeyProvider, value: string): Promise<AccountApiKeyStatus> => {
  const filter = await ownedAccount(accountId);
  requireProvider(provider);
  await readKeys(filter);
  if (typeof value !== 'string') throw new Error('API 키를 확인하세요.');
  const trimmed = value.trim();
  const update = trimmed ? { $set: { [`apiKeys.${provider}`]: trimmed } } : { $unset: { [`apiKeys.${provider}`]: '' } };
  const result = await Account.updateOne(filter, update);
  if (!result.matchedCount) throw new Error('계정을 찾을 수 없습니다.');
  return statusFor(await readKeys(filter));
};

export const clearAccountApiKeyAction = async (accountId: string, provider: ApiKeyProvider): Promise<AccountApiKeyStatus> =>
  updateAccountApiKeyAction(accountId, provider, '');

export const testAccountApiKeyAction = async (accountId: string, provider: ApiKeyProvider): Promise<TestKeyResult> => {
  const filter = await ownedAccount(accountId);
  requireProvider(provider);
  const keys = await readKeys(filter);
  return testAccountKey(provider, keys?.[provider]);
};
