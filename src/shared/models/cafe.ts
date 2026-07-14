import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICafe extends Document {
  userId: string;
  cafeId: string;
  cafeUrl: string;
  menuId: string;
  name: string;
  categories: string[];
  categoryMenuIds?: Record<string, string>;
  categoryAliases?: Record<string, string>;
  commentableMenuIds?: number[];
  /** 이 카페를 실제로 개설한(매니저) 네이버 계정 ID. naver-cafe-creation 으로 만든 카페만 채워짐 */
  ownerAccountId?: string;
  isDefault?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CafeSchema = new Schema<ICafe>(
  {
    userId: { type: String, required: true, index: true },
    cafeId: { type: String, required: true },
    cafeUrl: { type: String, required: true },
    menuId: { type: String, required: true },
    name: { type: String, required: true },
    categories: { type: [String], default: [] },
    categoryMenuIds: { type: Map, of: String },
    categoryAliases: { type: Map, of: String },
    commentableMenuIds: { type: [Number], default: [] },
    ownerAccountId: { type: String },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 같은 유저 내에서 cafeId 중복 방지
CafeSchema.index({ userId: 1, cafeId: 1 }, { unique: true });

export const Cafe: Model<ICafe> =
  mongoose.models.Cafe || mongoose.model<ICafe>('Cafe', CafeSchema, 'cafes');
