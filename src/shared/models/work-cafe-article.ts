import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkCafeArticle extends Document {
  ownerName: string;
  cafeSlug: string;
  cafeUrl: string;
  cafeId: string;
  articleId: number;
  articleUrl: string;
  subject: string;
  nickname: string;
  memberKey?: string;
  menuId: number;
  menuName?: string;
  readCount: number;
  likeCount: number;
  commentCount: number;
  writeDateTimestamp: number;
  collectedAt: Date;
  latestCollectionId: string;
  needsCommentWork: boolean;
  targetCommentCount: number;
  commentWorkStatus: 'pending' | 'generated' | 'queued' | 'done' | 'skipped';
  createdAt: Date;
  updatedAt: Date;
}

const WorkCafeArticleSchema = new Schema<IWorkCafeArticle>(
  {
    ownerName: { type: String, required: true, index: true },
    cafeSlug: { type: String, required: true, index: true },
    cafeUrl: { type: String, required: true },
    cafeId: { type: String, required: true, index: true },
    articleId: { type: Number, required: true, index: true },
    articleUrl: { type: String, required: true },
    subject: { type: String, required: true },
    nickname: { type: String, default: '' },
    memberKey: { type: String },
    menuId: { type: Number, default: 0 },
    menuName: { type: String, default: '' },
    readCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    writeDateTimestamp: { type: Number, default: 0 },
    collectedAt: { type: Date, required: true },
    latestCollectionId: { type: String, required: true, index: true },
    needsCommentWork: { type: Boolean, default: false, index: true },
    targetCommentCount: { type: Number, default: 8 },
    commentWorkStatus: {
      type: String,
      enum: ['pending', 'generated', 'queued', 'done', 'skipped'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
);

WorkCafeArticleSchema.index({ cafeId: 1, articleId: 1 }, { unique: true });
WorkCafeArticleSchema.index({ needsCommentWork: 1, commentWorkStatus: 1, cafeId: 1 });

export const WorkCafeArticle: Model<IWorkCafeArticle> =
  mongoose.models.WorkCafeArticle ||
  mongoose.model<IWorkCafeArticle>('WorkCafeArticle', WorkCafeArticleSchema, 'workcafearticles');
