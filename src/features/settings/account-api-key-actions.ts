'use server';

import { GoogleGenAI } from '@google/genai';
import { connectDB } from '@/shared/lib/mongodb';
import {
  Account,
  resolveGeminiApiKeyForAccount,
  resolveDeepseekApiKeyForAccount,
} from '@/shared/models/account';

export type ApiKeyProvider = 'gemini' | 'deepseek';

export interface AccountApiKeyStatus {
  hasGemini: boolean;
  geminiMasked: string | null;
  hasDeepseek: boolean;
  deepseekMasked: string | null;
}

const maskKey = (key: string): string => {
  if (key.length <= 8) return '****';
  return `${key.slice(0, 6)}${'*'.repeat(6)}${key.slice(-4)}`;
};

export const getAccountApiKeyStatusAction = async (
  accountId: string
): Promise<AccountApiKeyStatus> => {
  await connectDB();
  const gemini = await resolveGeminiApiKeyForAccount(accountId);
  const deepseek = await resolveDeepseekApiKeyForAccount(accountId);

  return {
    hasGemini: Boolean(gemini),
    geminiMasked: gemini ? maskKey(gemini) : null,
    hasDeepseek: Boolean(deepseek),
    deepseekMasked: deepseek ? maskKey(deepseek) : null,
  };
};

export const updateAccountApiKeyAction = async (
  accountId: string,
  provider: ApiKeyProvider,
  value: string
): Promise<AccountApiKeyStatus> => {
  await connectDB();
  const trimmed = value.trim();
  await Account.updateOne(
    { accountId },
    { $set: { [`apiKeys.${provider}`]: trimmed || undefined } }
  );
  return getAccountApiKeyStatusAction(accountId);
};

export const clearAccountApiKeyAction = async (
  accountId: string,
  provider: ApiKeyProvider
): Promise<AccountApiKeyStatus> => {
  await connectDB();
  await Account.updateOne({ accountId }, { $unset: { [`apiKeys.${provider}`]: '' } });
  return getAccountApiKeyStatusAction(accountId);
};

export interface TestKeyResult {
  success: boolean;
  message: string;
  elapsedMs?: number;
}

export const testAccountApiKeyAction = async (
  accountId: string,
  provider: ApiKeyProvider
): Promise<TestKeyResult> => {
  await connectDB();
  const apiKey =
    provider === 'gemini'
      ? await resolveGeminiApiKeyForAccount(accountId)
      : await resolveDeepseekApiKeyForAccount(accountId);

  if (!apiKey) {
    return { success: false, message: '이 계정에 등록된 키가 없습니다.' };
  }

  const startedAt = Date.now();

  if (provider === 'gemini') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'say ok' }] }],
      });
      const elapsedMs = Date.now() - startedAt;
      const text = response.text?.trim();
      if (!text) return { success: false, message: '응답이 비어있습니다.', elapsedMs };
      return { success: true, message: `응답: "${text}"`, elapsedMs };
    } catch (error) {
      const elapsedMs = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message, elapsedMs };
    }
  }

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'say ok' }],
        max_tokens: 5,
      }),
    });
    const elapsedMs = Date.now() - startedAt;
    if (!res.ok) {
      const errorBody = await res.text();
      return { success: false, message: `${res.status}: ${errorBody.slice(0, 200)}`, elapsedMs };
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return { success: true, message: `응답: "${text}"`, elapsedMs };
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, message, elapsedMs };
  }
};
