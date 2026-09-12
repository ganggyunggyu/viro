import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import type { ApiKeyProvider } from '@/features/settings/account-api-key-actions';

export interface TestKeyResult { success: boolean; message: string; elapsedMs?: number }

export const testAccountKey = async (provider: ApiKeyProvider, apiKey?: string): Promise<TestKeyResult> => {
  if (!apiKey) return { success: false, message: '이 계정에 등록된 키가 없습니다.' };
  const startedAt = Date.now();
  try {
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: [{ role: 'user', parts: [{ text: 'say ok' }] }] });
      if (!response.text?.trim()) throw new Error('Empty provider response');
    } else {
      const { data } = await axios.post<{ choices?: { message?: { content?: unknown } }[] }>('https://api.deepseek.com/v1/chat/completions', {
        model: 'deepseek-chat', messages: [{ role: 'user', content: 'say ok' }], max_tokens: 5,
      }, { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 10_000, maxRedirects: 0 });
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) throw new Error('Empty provider response');
    }
    return { success: true, message: 'API 연결을 확인했습니다.', elapsedMs: Date.now() - startedAt };
  } catch {
    return { success: false, message: 'API 연결에 실패했습니다. 키와 제공업체 상태를 확인하세요.', elapsedMs: Date.now() - startedAt };
  }
};
