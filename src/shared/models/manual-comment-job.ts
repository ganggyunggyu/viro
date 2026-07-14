import mongoose, { Schema, Document, Model } from 'mongoose';

export type ManualCommentJobStatus = 'pending' | 'running' | 'done' | 'failed';
export type ManualCommentJobMode = 'fixed' | 'generate' | 'agent';

export interface IManualCommentResult {
  index: number;
  accountId?: string;
  nickname?: string;
  content: string;
  success: boolean;
  error?: string;
  commentId?: string;
  postedAt?: Date;
}

export interface IManualCommentJob extends Document {
  userId: string;
  articleUrl: string;
  cafeSlug: string;
  cafeId: string;
  articleId: number;
  mode: ManualCommentJobMode;
  fixedComments?: string[];
  generateMinCount?: number;
  generateMaxCount?: number;
  delayMinMs: number;
  delayMaxMs: number;
  status: ManualCommentJobStatus;
  errorMessage?: string;
  agentSummary?: string;
  results: IManualCommentResult[];
  claimedAt?: Date;
  claimedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ManualCommentResultSchema = new Schema<IManualCommentResult>(
  {
    index: { type: Number, required: true },
    accountId: { type: String },
    nickname: { type: String },
    content: { type: String, required: true },
    success: { type: Boolean, required: true },
    error: { type: String },
    commentId: { type: String },
    postedAt: { type: Date },
  },
  { _id: false },
);

const ManualCommentJobSchema = new Schema<IManualCommentJob>(
  {
    userId: { type: String, required: true, index: true },
    articleUrl: { type: String, required: true },
    cafeSlug: { type: String, required: true },
    cafeId: { type: String, required: true, index: true },
    articleId: { type: Number, required: true },
    mode: { type: String, enum: ['fixed', 'generate', 'agent'], required: true },
    fixedComments: { type: [String] },
    generateMinCount: { type: Number },
    generateMaxCount: { type: Number },
    delayMinMs: { type: Number, required: true },
    delayMaxMs: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'running', 'done', 'failed'], default: 'pending', index: true },
    errorMessage: { type: String },
    agentSummary: { type: String },
    results: { type: [ManualCommentResultSchema], default: [] },
    claimedAt: { type: Date },
    claimedBy: { type: String },
  },
  { timestamps: true },
);

ManualCommentJobSchema.index({ status: 1, createdAt: 1 });

export const ManualCommentJob: Model<IManualCommentJob> =
  mongoose.models.ManualCommentJob ||
  mongoose.model<IManualCommentJob>('ManualCommentJob', ManualCommentJobSchema, 'manualcommentjobs');
