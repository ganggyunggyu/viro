import type { mongo } from 'mongoose';
import type { RetirementMember, RetirementSelector, RetirementStore } from '../src/shared/lib/dabut-auth/retirement';

const sessionsFor = (userId: string) => ({ userId, label: { $ne: 'dabut-session' }, revoked: { $ne: true } });

export const createRetirementStore = (database: mongo.Db): RetirementStore => {
  const users = database.collection<RetirementMember>('users');
  const sessions = database.collection('agenttokens');
  return {
    find: ({ userId, dabutUserId }) => users.find({ $or: [{ userId }, { dabutUserId }] }, { projection: { userId: 1, dabutUserId: 1, password: 1, authProvider: 1 } }).limit(2).toArray(),
    countSessions: (userId) => sessions.countDocuments(sessionsFor(userId)),
    retire: async (selector: RetirementSelector) => {
      const result = await users.updateOne(selector, { $set: { authProvider: 'dabut' }, $unset: { password: '' } });
      return result.matchedCount === 1;
    },
    revoke: async (userId) => (await sessions.updateMany(sessionsFor(userId), { $set: { revoked: true } })).modifiedCount,
  };
};
