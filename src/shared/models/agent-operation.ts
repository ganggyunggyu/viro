import mongoose, { Schema, type Model } from 'mongoose';
import type { SchedulerDispatchFields } from '@/shared/lib/agent-scheduler/outbox';
import type { AgentOperationInput, AgentOperationStatus, AgentOperationResult } from '@/shared/lib/agent-management/contract';
import { OPERATION_ERROR_CODES } from '@/shared/lib/agent-management/operation-failure';

export interface IAgentOperation extends AgentOperationInput, Partial<SchedulerDispatchFields> {
  _id: mongoose.Types.ObjectId;
  userId: string;
  fingerprint: string;
  status: AgentOperationStatus;
  serviceEffects?: Record<string, { status: 'running' | 'done' | 'uncertain'; result?: unknown }>;
  claimedBy?: string;
  claimedAt?: Date;
  result?: AgentOperationResult;
  createdAt: Date;
  updatedAt: Date;
}

const AgentOperationSchema = new Schema<IAgentOperation>({
  userId: { type: String, required: true, index: true },
  fingerprint: { type: String, required: true },
  type: { type: String, enum: ['join_cafe', 'write_comment'], required: true },
  accountId: { type: String, required: true },
  cafeId: { type: String, required: true },
  articleId: { type: Number },
  content: { type: String },
  nickname: { type: String },
  status: { type: String, enum: ['pending', 'running', 'done', 'failed', 'needs_review'], default: 'pending' },
  executionTarget: { type: String, enum: ['scheduler'] },
  dispatchId: String, dispatchState: { type: String, enum: ['pending', 'delivered'] },
  dispatchAttempts: Number, deliveredAt: Date,
  serviceEffects: { type: Schema.Types.Mixed },
  claimedBy: { type: String },
  claimedAt: { type: Date },
  result: {
    type: new Schema<AgentOperationResult>({
      success: { type: Boolean, required: true },
      requiresReview: { type: Boolean },
      commentId: { type: String },
      membershipStatus: { type: String, enum: ['joined', 'alreadyMember', 'pending', 'failed'] },
      error: { type: String },
      errorCode: { type: String, enum: OPERATION_ERROR_CODES },
    }, { _id: false }),
  },
}, { timestamps: true });

AgentOperationSchema.index({ userId: 1, status: 1, createdAt: 1 });
AgentOperationSchema.index({ executionTarget: 1, status: 1, dispatchState: 1, createdAt: 1 });

export const AgentOperation: Model<IAgentOperation> = mongoose.models.AgentOperation
  || mongoose.model<IAgentOperation>('AgentOperation', AgentOperationSchema, 'agentoperations');
