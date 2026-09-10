import { connectDB } from '@/shared/lib/mongodb';
import { dabutClient } from '@/shared/lib/dabut-auth/transport';
import { identityStore } from '@/shared/lib/dabut-auth/store';
import { linkDabutIdentity } from '@/shared/lib/dabut-auth/link';
import type { LinkInput } from '@/shared/lib/dabut-auth/contracts';
import { readServiceSessionMetadata, saveServiceSessionMetadata } from '@/shared/lib/dabut-auth/session-metadata';

export { dabutClient } from '@/shared/lib/dabut-auth/transport';
export { isServiceToken } from '@/shared/lib/dabut-auth/client';
export { authError, isAuthError, type LinkInput } from '@/shared/lib/dabut-auth/contracts';

export const connectDabutAccount = async (input: LinkInput) => {
  const identity = await dabutClient.verify(input.token);
  await connectDB();
  const user = await linkDabutIdentity(identityStore, identity, input);
  await saveServiceSessionMetadata(input.token, user.userId, identity.expiresAt);
  return { token: input.token, userId: user.userId, dabutUserId: identity.user.id, displayName: user.displayName, user, expiresAt: identity.expiresAt };
};

export const resolveDabutAgentIdentity = async (token: string) => {
  const identity = await dabutClient.verify(token);
  await connectDB();
  const user = await identityStore.findLinked(identity.user.id);
  if (!user?.isActive) return null;
  return readServiceSessionMetadata(token, user.userId);
};
