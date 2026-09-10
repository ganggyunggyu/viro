import { createHash } from 'node:crypto';

export interface AgentIdentity { userId: string; tokenId: string }
export interface StoredSession extends AgentIdentity { revoked?: boolean; expiresAt?: Date }
interface SessionStore {
  find: (hash: string) => Promise<StoredSession | null>;
  activeUser: (userId: string) => Promise<boolean>;
  touch: (tokenId: string) => Promise<void>;
}

export const hashAgentToken = (raw: string) => createHash('sha256').update(raw).digest('hex');
export const resolveAgentSession = async (store: SessionStore, raw: string, now = Date.now()): Promise<AgentIdentity | null> => {
  if (!raw) return null;
  const session = await store.find(hashAgentToken(raw));
  if (!session || session.revoked || (session.expiresAt && session.expiresAt.getTime() <= now)) return null;
  if (!await store.activeUser(session.userId)) return null;
  await store.touch(session.tokenId);
  return { userId: session.userId, tokenId: session.tokenId };
};
