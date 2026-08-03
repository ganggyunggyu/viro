'use server';

import { GoogleGenAI } from '@google/genai';
import { connectDB } from '@/shared/lib/mongodb';
import {
  getApiKeySettings,
  updateApiKeySettings,
  resolveGeminiApiKey,
} from '@/shared/models/api-key-settings';

export interface ApiKeySettingsData {
  hasGeminiApiKey: boolean;
  geminiApiKeyMasked: string | null;
  geminiApiKeySource: 'db' | 'env' | 'none';
}

const maskKey = (key: string): string => {
  if (key.length <= 8) return '****';
  return `${key.slice(0, 6)}${'*'.repeat(6)}${key.slice(-4)}`;
};

export const getApiKeySettingsAction = async (): Promise<ApiKeySettingsData> => {
  await connectDB();
  const settings = await getApiKeySettings();
  const resolved = await resolveGeminiApiKey();

  return {
    hasGeminiApiKey: Boolean(resolved),
    geminiApiKeyMasked: resolved ? maskKey(resolved) : null,
    geminiApiKeySource: settings.geminiApiKey ? 'db' : resolved ? 'env' : 'none',
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

export interface TestGeminiKeyResult {
  success: boolean;
  message: string;
  elapsedMs?: number;
}

export const testGeminiApiKeyAction = async (): Promise<TestGeminiKeyResult> => {
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
