export interface RetirementSelector { userId: string; dabutUserId: string }
export interface RetirementMember extends RetirementSelector { password?: string; authProvider?: string }
export interface RetirementStore {
  find: (selector: RetirementSelector) => Promise<RetirementMember[]>;
  countSessions: (userId: string) => Promise<number>;
  retire: (selector: RetirementSelector) => Promise<boolean>;
  revoke: (userId: string) => Promise<number>;
}

export const retireLinkedCredentials = async (store: RetirementStore, selector: RetirementSelector, apply = false) => {
  const { userId, dabutUserId } = selector;
  if (![userId, dabutUserId].every((value) => typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= 200)) {
    throw new Error('Explicit member mapping is required');
  }
  const members = await store.find(selector);
  const [member] = members;
  if (members.length !== 1 || member.userId !== userId || member.dabutUserId !== dabutUserId) throw new Error('Member mapping is missing, ambiguous or changed');
  const credentialsPending = Boolean(member.password) || member.authProvider !== 'dabut';
  const legacySessions = await store.countSessions(userId);
  let credentialsRetired = false;
  let sessionsRevoked = 0;
  if (apply) {
    if (credentialsPending) {
      credentialsRetired = await store.retire(selector);
      if (!credentialsRetired) throw new Error('Member mapping changed before retirement');
    }
    if (legacySessions > 0) sessionsRevoked = await store.revoke(userId);
  }
  return { userId, dabutUserId, mode: apply ? 'apply' : 'dry-run', credentialsPending, legacySessions, credentialsRetired, sessionsRevoked };
};
