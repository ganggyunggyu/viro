'use server';

import { connectDB } from '@/shared/lib/mongodb';
import { AgentToken } from '@/shared/models';
import { getCurrentUserId } from '@/shared/config/user';
import { generateAgentToken, hashAgentToken } from '@/shared/lib/agent-broker';

export interface AgentTokenView {
  id: string;
  label: string;
  lastSeenAt: string | null;
  createdAt: string;
}

export interface IssueAgentTokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

const requireUserId = async (): Promise<string | null> => {
  const userId = await getCurrentUserId();
  if (!userId || userId === 'default-user') {
    return null;
  }
  return userId;
};

export const issueAgentToken = async (label: string): Promise<IssueAgentTokenResult> => {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: '로그인이 필요합니다' };
  }

  await connectDB();

  const rawToken = generateAgentToken();
  await AgentToken.create({
    userId,
    tokenHash: hashAgentToken(rawToken),
    label: label.trim() || '에이전트',
  });

  return { success: true, token: rawToken };
};

export const listAgentTokens = async (): Promise<AgentTokenView[]> => {
  const userId = await requireUserId();
  if (!userId) {
    return [];
  }

  await connectDB();

  const docs = await AgentToken.find({ userId, revoked: { $ne: true } })
    .sort({ createdAt: -1 })
    .lean<Array<{ _id: unknown; label: string; lastSeenAt?: Date; createdAt: Date }>>();

  return docs.map((doc) => ({
    id: String(doc._id),
    label: doc.label,
    lastSeenAt: doc.lastSeenAt ? new Date(doc.lastSeenAt).toISOString() : null,
    createdAt: new Date(doc.createdAt).toISOString(),
  }));
};

export const revokeAgentToken = async (tokenId: string): Promise<{ success: boolean }> => {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false };
  }

  await connectDB();

  const result = await AgentToken.updateOne({ _id: tokenId, userId }, { $set: { revoked: true } });
  return { success: result.matchedCount > 0 };
};
