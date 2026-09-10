import { AgentToken } from '@/shared/models/agent-token';
import { hashAgentToken } from '@/shared/lib/agent-broker/session';

export const saveServiceSessionMetadata = async (token: string, userId: string, expiresAt: string): Promise<void> => {
  await AgentToken.findOneAndUpdate({ tokenHash: hashAgentToken(token) }, {
    $set: { userId, label: 'dabut-session', expiresAt: new Date(expiresAt), revoked: false },
  }, { upsert: true, new: true });
};

export const readServiceSessionMetadata = async (token: string, userId: string) => {
  const session = await AgentToken.findOne({ tokenHash: hashAgentToken(token), userId, label: 'dabut-session' }).lean();
  if (!session || session.revoked || (session.expiresAt && session.expiresAt.getTime() <= Date.now())) return null;
  await AgentToken.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date() } });
  return { userId, tokenId: String(session._id) };
};
