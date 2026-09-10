import { connectDB } from '@/shared/lib/mongodb';
import { User } from '@/shared/models/user';
import { authenticateLogin } from '@/shared/lib/agent-management/login-service';

export const loginWithCredentials = async (loginId: unknown, password: unknown) => {
  await connectDB();
  return authenticateLogin({
    findActive: async (name) => User.findOne({ loginId: name, isActive: true }).lean(),
    updatePassword: async (userId, hash) => {
      await User.updateOne({ userId, isActive: true }, { $set: { password: hash } });
    },
  }, loginId, password);
};
