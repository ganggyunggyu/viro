import { connectDB } from '@/shared/lib/mongodb';
import { Account, Cafe } from '@/shared/models';
import { createAccountRegistration } from '@/shared/lib/account-registration-harness';
import { createCafeRegistration } from '@/shared/lib/cafe-registration-harness';
import { AgentManagementError, parseAccountRegistration, parseCafeRegistration, toSafeAccount } from '@/shared/lib/agent-management/contract';

export const listAgentAccounts = async (userId: string) => {
  await connectDB();
  const accounts = await Account.find({ userId, isActive: true })
    .select('accountId password nickname role isActive').sort({ createdAt: 1 }).lean();
  return accounts.map(toSafeAccount);
};

export const registerAgentAccount = async (userId: string, raw: unknown) => {
  const input = parseAccountRegistration(raw);
  await connectDB();
  const register = createAccountRegistration({
    findActive: async (filter) => Account.exists(filter),
    upsert: async ({ filter, set }) => {
      const result = await Account.updateOne(filter, { $setOnInsert: { ...set, userId, role: input.role } }, { upsert: true, runValidators: true });
      if (!result.upsertedCount) throw new AgentManagementError('이미 등록된 계정입니다', 409, 'already_registered');
    },
  });
  const result = await register({ ...input, userId });
  if (!result.success) throw new AgentManagementError('이미 등록된 계정입니다', 409, 'already_registered');
  const saved = await Account.findOne({ userId, accountId: input.accountId, isActive: true }).select('accountId password nickname role isActive').lean();
  if (!saved) throw new AgentManagementError('저장된 계정을 확인하지 못했습니다', 503, 'readback_failed');
  return toSafeAccount(saved);
};

export const registerAgentCafe = async (userId: string, raw: unknown) => {
  const input = parseCafeRegistration(raw);
  await connectDB();
  const register = createCafeRegistration({
    findActive: async (filter) => Cafe.exists(filter),
    upsert: async ({ filter, update }) => {
      const result = await Cafe.updateOne(filter, { $setOnInsert: { ...update.$set, ...filter } }, { upsert: true, runValidators: true });
      if (!result.upsertedCount) throw new AgentManagementError('이미 등록된 카페입니다', 409, 'already_registered');
    },
  });
  const result = await register({ ...input, userId, categories: [] });
  if (!result.success) throw new AgentManagementError('이미 등록된 카페입니다', 409, 'already_registered');
  const saved = await Cafe.findOne({ userId, cafeId: input.cafeId, isActive: true }).select('cafeId cafeUrl name menuId').lean();
  if (!saved) throw new AgentManagementError('저장된 카페를 확인하지 못했습니다', 503, 'readback_failed');
  return { cafeId: saved.cafeId, cafeUrl: saved.cafeUrl, name: saved.name, menuId: saved.menuId };
};
