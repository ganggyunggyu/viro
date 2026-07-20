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
  },
  { timestamps: true }
);

// 같은 유저 내에서 accountId 중복 방지
AccountSchema.index({ userId: 1, accountId: 1 }, { unique: true });

export const Account: Model<IAccount> =
  mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);
