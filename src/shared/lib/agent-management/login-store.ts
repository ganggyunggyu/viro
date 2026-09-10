import { connectDB } from '@/shared/lib/mongodb';
import { User } from '@/shared/models/user';
import { authenticateLogin } from '@/shared/lib/agent-management/login-service';

const verifyCredentials = async (loginId: unknown, password: unknown, forAccountLink: boolean) => {
  await connectDB();
  return authenticateLogin({
    findActive: async (name) => User.findOne({ loginId: name, isActive: true }).lean(),
    updatePassword: async (userId, hash) => {
      await User.updateOne({ userId, isActive: true }, { $set: { password: hash } });
    },
  }, loginId, password, { forAccountLink });
};

export const loginWithCredentials = (loginId: unknown, password: unknown) => verifyCredentials(loginId, password, false);
export const verifyLegacyLinkCredentials = (loginId: unknown, password: unknown) => verifyCredentials(loginId, password, true);
