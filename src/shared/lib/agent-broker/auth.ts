import { randomBytes } from 'node:crypto';
import { connectDB } from '@/shared/lib/mongodb';
import { AgentToken } from '@/shared/models/agent-token';
import { User } from '@/shared/models/user';
import { resolveAgentSession, type AgentIdentity } from '@/shared/lib/agent-broker/session';
import { resolveDabutAgentIdentity } from '@/shared/lib/dabut-auth';
export { hashAgentToken, type AgentIdentity } from '@/shared/lib/agent-broker/session';

export const generateAgentToken = (): string => randomBytes(32).toString('hex');
export const getBearerToken = (request: Request): string =>
  (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();

export const authenticateAgentToken = async (rawToken: string): Promise<AgentIdentity | null> => {
  if (!rawToken) return null;
  if (rawToken.startsWith('ds1_')) {
    try { return await resolveDabutAgentIdentity(rawToken); } catch { return null; }
  }
  await connectDB();
  return resolveAgentSession({
    find: async (tokenHash) => {
      const session = await AgentToken.findOne({ tokenHash }).lean();
      return session ? { userId: session.userId, tokenId: String(session._id), revoked: session.revoked, expiresAt: session.expiresAt } : null;
    },
    activeUser: async (userId) => Boolean(await User.exists({
      userId, isActive: true, dabutUserId: { $exists: false }, authProvider: { $ne: 'dabut' },
    })),
    touch: async (tokenId) => { await AgentToken.updateOne({ _id: tokenId }, { $set: { lastSeenAt: new Date() } }); },
  }, rawToken);
};
