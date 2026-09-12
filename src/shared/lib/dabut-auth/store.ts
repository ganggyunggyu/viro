import { User } from '@/shared/models/user';
import { verifyLegacyLinkCredentials } from '@/shared/lib/agent-management/login-store';
import type { IdentityStore } from '@/shared/lib/dabut-auth/contracts';
import { AgentToken } from '@/shared/models/agent-token';

export const identityStore: IdentityStore = {
  findLinked: async (dabutUserId) => User.findOne({ dabutUserId }).lean(),
  findLogin: async (loginId) => User.findOne({ loginId }).lean(),
  verifyLegacy: verifyLegacyLinkCredentials,
  link: async (userId, dabutUserId) => {
    try {
      const user = await User.findOneAndUpdate({
        userId, isActive: true, $or: [{ dabutUserId: { $exists: false } }, { dabutUserId }],
      }, { $set: { dabutUserId, authProvider: 'dabut' }, $unset: { password: '' } }, { new: true }).lean();
      if (user) await AgentToken.updateMany({ userId, label: { $ne: 'dabut-session' }, revoked: { $ne: true } }, { $set: { revoked: true } });
      return user;
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
