import mongoose, { Schema, type Model } from 'mongoose';
import type { SchedulerDispatchFields } from '@/shared/lib/agent-scheduler/outbox';
import type { ViroDesktopAction, ViroDesktopActionResponse } from '@/shared/types/viro-desktop';

export interface IAgentAction extends Partial<SchedulerDispatchFields> {
  _id: string; userId: string; fingerprint: string; action: ViroDesktopAction;
  status: 'pending' | 'running' | 'done' | 'failed' | 'needs_review';
  serviceEffects?: Record<string, { status: 'running' | 'done' | 'uncertain'; result?: unknown }>;
  claimedBy?: string; claimedAt?: Date; result?: ViroDesktopActionResponse;
  createdAt: Date; updatedAt: Date;
}

const schema = new Schema<IAgentAction>({
  _id: { type: String, required: true }, userId: { type: String, required: true, index: true },
  fingerprint: { type: String, required: true }, action: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['pending', 'running', 'done', 'failed', 'needs_review'], default: 'pending' },
  executionTarget: { type: String, enum: ['scheduler'] },
  dispatchId: String, dispatchState: { type: String, enum: ['pending', 'delivered'] },
  dispatchAttempts: Number, deliveredAt: Date,
  serviceEffects: { type: Schema.Types.Mixed },
  claimedBy: String, claimedAt: Date, result: Schema.Types.Mixed,
}, { timestamps: true });
schema.index({ userId: 1, status: 1, createdAt: 1 });
schema.index({ executionTarget: 1, status: 1, dispatchState: 1, createdAt: 1 });
export const AgentAction: Model<IAgentAction> = mongoose.models.AgentAction || mongoose.model('AgentAction', schema, 'agentactions');
