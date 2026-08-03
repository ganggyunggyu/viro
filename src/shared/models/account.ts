import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ActivityHours {
  start: number; // 0-23
  end: number; // 0-23
}

export type AccountRole = 'writer' | 'commenter';

export interface AccountSheetMeta {
  blogUrl?: string;
  category?: string;
  owner?: string;
  masterRowNumber?: number;
  cafeRowNumber?: number;
  masterNote?: string;
  cafeNote?: string;
}

export interface AccountApiKeys {
  gemini?: string; // 이 계정으로 로그인할 때 캡차 풀이에 쓸 키
  deepseek?: string; // 이 계정으로 에이전트 댓글 작성 시 쓸 키
}

export interface IAccount extends Document {
  userId: string;
  accountId: string;
  password: string;
  nickname?: string;
  isMain?: boolean;
  activityHours?: ActivityHours;
  restDays?: number[];
  dailyPostLimit?: number;
  personaId?: string;
  role?: AccountRole;
  isActive: boolean;
  campaignTag?: string;
  excludeFromAutoComment?: boolean;
  targetCafes?: string;
  targetCafeIds?: string[];
  mvpn?: string;
  sheetMeta?: AccountSheetMeta;
  apiKeys?: AccountApiKeys;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityHoursSchema = new Schema<ActivityHours>(
  {
    start: { type: Number, min: 0, max: 23 },
    end: { type: Number, min: 0, max: 24 },
  },
  { _id: false }
);

const AccountSheetMetaSchema = new Schema<AccountSheetMeta>(
  {
    blogUrl: { type: String },
    category: { type: String },
    owner: { type: String },
    masterRowNumber: { type: Number },
    cafeRowNumber: { type: Number },
    masterNote: { type: String },
    cafeNote: { type: String },
  },
  { _id: false },
);

const AccountApiKeysSchema = new Schema<AccountApiKeys>(
  {
    gemini: { type: String },
    deepseek: { type: String },
  },
  { _id: false },
);

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: String, required: true, index: true },
    accountId: { type: String, required: true },
    password: { type: String, required: true },
    nickname: { type: String },
    isMain: { type: Boolean, default: false },
    activityHours: { type: ActivityHoursSchema },
    restDays: { type: [Number] },
    dailyPostLimit: { type: Number },
    personaId: { type: String },
    role: { type: String, enum: ['writer', 'commenter'] },
    isActive: { type: Boolean, default: true },
    campaignTag: { type: String },
    excludeFromAutoComment: { type: Boolean, default: false },
    targetCafes: { type: String },
    targetCafeIds: { type: [String], default: [] },
    mvpn: { type: String },
    sheetMeta: { type: AccountSheetMetaSchema },
    apiKeys: { type: AccountApiKeysSchema },
  },
  { timestamps: true }
);

// 같은 유저 내에서 accountId 중복 방지
AccountSchema.index({ userId: 1, accountId: 1 }, { unique: true });

export const Account: Model<IAccount> =
  mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);

/**
 * 이 계정 전용으로 등록된 Gemini 키. 전역 폴백은 두지 않는다 — 계정마다 키를
 * 귀속시켜서, 키 하나가 결제 차단돼도 다른 계정/키 그룹은 영향 안 받게 하려는
 * 목적이다. 등록 안 된 계정은 그냥 캡차를 못 푼다(명확한 에러로 드러나야 함).
 */
export const resolveGeminiApiKeyForAccount = async (accountId: string): Promise<string | null> => {
  const account = await Account.findOne({ accountId }).select('apiKeys').lean();
  return account?.apiKeys?.gemini || null;
};

export const resolveDeepseekApiKeyForAccount = async (accountId: string): Promise<string | null> => {
  const account = await Account.findOne({ accountId }).select('apiKeys').lean();
  return account?.apiKeys?.deepseek || null;
};
