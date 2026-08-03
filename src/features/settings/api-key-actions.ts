'use server';

import { GoogleGenAI } from '@google/genai';
import { connectDB } from '@/shared/lib/mongodb';
import {
  getApiKeySettings,
  updateApiKeySettings,
  resolveGeminiApiKey,
  resolveDeepseekApiKey,
} from '@/shared/models/api-key-settings';

export interface ApiKeySettingsData {
  hasGeminiApiKey: boolean;
  geminiApiKeyMasked: string | null;
  geminiApiKeySource: 'db' | 'env' | 'none';
  hasDeepseekApiKey: boolean;
  deepseekApiKeyMasked: string | null;
  deepseekApiKeySource: 'db' | 'env' | 'none';
}

const maskKey = (key: string): string => {
  if (key.length <= 8) return '****';
  return `${key.slice(0, 6)}${'*'.repeat(6)}${key.slice(-4)}`;
};

export const getApiKeySettingsAction = async (): Promise<ApiKeySettingsData> => {
  await connectDB();
  const settings = await getApiKeySettings();
  const resolvedGemini = await resolveGeminiApiKey();
  const resolvedDeepseek = await resolveDeepseekApiKey();

  return {
    hasGeminiApiKey: Boolean(resolvedGemini),
    geminiApiKeyMasked: resolvedGemini ? maskKey(resolvedGemini) : null,
    geminiApiKeySource: settings.geminiApiKey ? 'db' : resolvedGemini ? 'env' : 'none',
    hasDeepseekApiKey: Boolean(resolvedDeepseek),
    deepseekApiKeyMasked: resolvedDeepseek ? maskKey(resolvedDeepseek) : null,
    deepseekApiKeySource: settings.deepseekApiKey ? 'db' : resolvedDeepseek ? 'env' : 'none',
  };
};

export const updateGeminiApiKeyAction = async (
  geminiApiKey: string
): Promise<ApiKeySettingsData> => {
  await connectDB();
  const trimmed = geminiApiKey.trim();
  await updateApiKeySettings({ geminiApiKey: trimmed || undefined });
  return getApiKeySettingsAction();
};

export const clearGeminiApiKeyAction = async (): Promise<ApiKeySettingsData> => {
  await connectDB();
  await updateApiKeySettings({ geminiApiKey: undefined });
  return getApiKeySettingsAction();
};

export const updateDeepseekApiKeyAction = async (
  deepseekApiKey: string
): Promise<ApiKeySettingsData> => {
  await connectDB();
  const trimmed = deepseekApiKey.trim();
  await updateApiKeySettings({ deepseekApiKey: trimmed || undefined });
  return getApiKeySettingsAction();
};

export const clearDeepseekApiKeyAction = async (): Promise<ApiKeySettingsData> => {
  await connectDB();
  await updateApiKeySettings({ deepseekApiKey: undefined });
  return getApiKeySettingsAction();
};

export interface TestKeyResult {
  success: boolean;
  message: string;
  elapsedMs?: number;
}

export const testGeminiApiKeyAction = async (): Promise<TestKeyResult> => {
  const apiKey = await resolveGeminiApiKey();
  if (!apiKey) {
    return { success: false, message: '등록된 키가 없습니다.' };
  }

  const startedAt = Date.now();
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'say ok' }] }],
    });
    const elapsedMs = Date.now() - startedAt;
    const text = response.text?.trim();

    if (!text) {
      return { success: false, message: '응답이 비어있습니다.', elapsedMs };
    }
    return { success: true, message: `응답: "${text}"`, elapsedMs };
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, message, elapsedMs };
  }
};

export const testDeepseekApiKeyAction = async (): Promise<TestKeyResult> => {
  const apiKey = await resolveDeepseekApiKey();
  if (!apiKey) {
    return { success: false, message: '등록된 키가 없습니다.' };
  }

  const startedAt = Date.now();
  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
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
