import { User } from '@/shared/models/user';
import { verifyLegacyLinkCredentials } from '@/shared/lib/agent-management/login-store';
import type { IdentityStore } from '@/shared/lib/dabut-auth/contracts';

export const identityStore: IdentityStore = {
  findLinked: async (dabutUserId) => User.findOne({ dabutUserId }).lean(),
  findLogin: async (loginId) => User.findOne({ loginId }).lean(),
  verifyLegacy: verifyLegacyLinkCredentials,
  link: async (userId, dabutUserId) => {
    try {
      return await User.findOneAndUpdate({
        userId, isActive: true, $or: [{ dabutUserId: { $exists: false } }, { dabutUserId }],
      }, { $set: { dabutUserId } }, { new: true }).lean();
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) return null;
      throw error;
    }
  },
  create: async ({ user }) => {
    const { id, username, label } = user;
    const created = await User.create({
      userId: `dabut-${id}`, dabutUserId: id, loginId: username,
      displayName: label || username, authProvider: 'dabut', isActive: true,
    });
    return created.toObject();
  },
};
