import mongoose, { Schema, Document, Model } from 'mongoose';
import { connectDB } from '@/shared/lib/mongodb';

export interface IApiKeySettings extends Document {
  geminiApiKey?: string;
  updatedAt: Date;
}

const ApiKeySettingsSchema = new Schema<IApiKeySettings>(
  {
    geminiApiKey: { type: String },
  },
  { timestamps: true }
);

export const ApiKeySettings: Model<IApiKeySettings> =
  mongoose.models.ApiKeySettings ||
  mongoose.model<IApiKeySettings>('ApiKeySettings', ApiKeySettingsSchema);

export const getApiKeySettings = async (): Promise<IApiKeySettings> => {
  await connectDB();
  let settings = await ApiKeySettings.findOne().lean();

  if (!settings) {
    const created = await ApiKeySettings.create({});
    settings = created.toObject();
  }

  return settings as IApiKeySettings;
};

export const updateApiKeySettings = async (
  updates: Partial<Pick<IApiKeySettings, 'geminiApiKey'>>
): Promise<IApiKeySettings> => {
  await connectDB();
  const settings = await ApiKeySettings.findOneAndUpdate(
    {},
    { $set: updates },
    { new: true, upsert: true, lean: true }
  );
  return settings as IApiKeySettings;
};

/**
 * 캡차 풀이(Gemini)에 쓰는 실제 키를 결정한다 — DB에 등록된 키가 있으면 그걸 우선하고,
 * 없으면 .env의 기존 값으로 폴백한다. pm2로 상시 실행되는 워커도 재시작 없이
 * 웹에서 바로 바꾼 키를 다음 캡차 시도부터 곧바로 쓰게 하려고 매번 DB를 조회한다
 * (캐싱하면 웹에서 키를 바꿔도 워커 재시작 전까지 반영이 안 됨).
 */
export const resolveGeminiApiKey = async (): Promise<string | null> => {
  await connectDB();
  const settings = await ApiKeySettings.findOne().select('geminiApiKey').lean();
  if (settings?.geminiApiKey) return settings.geminiApiKey;

  return (
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    null
  );
};
