import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * 이용자 로컬 에이전트(로컬 머신에서 Playwright를 돌리는 러너)를 특정 userId에 묶는
 * 페어링 토큰. 원문 토큰은 발급 시 1회만 노출하고 DB에는 sha256 해시만 저장한다.
 * 에이전트는 이 토큰만 보유하며 DB/큐 자격증명은 갖지 않는다(브로커 API가 대신 접근).
 */
export interface IAgentToken extends Document {
  userId: string;
  tokenHash: string;
  label: string;
  revoked: boolean;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AgentTokenSchema = new Schema<IAgentToken>(
  {
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    revoked: { type: Boolean, default: false },
    lastSeenAt: { type: Date },
  },
  { timestamps: true },
);

export const AgentToken: Model<IAgentToken> =
  mongoose.models.AgentToken ||
  mongoose.model<IAgentToken>('AgentToken', AgentTokenSchema, 'agenttokens');
