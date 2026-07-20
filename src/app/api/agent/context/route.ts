import { NextResponse } from 'next/server';
import { getAllAccounts } from '@/shared/config/accounts';
import { getAllCafes } from '@/shared/config/cafes';
import { authenticateAgentToken, getBearerToken } from '@/shared/lib/agent-broker';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  const identity = await authenticateAgentToken(getBearerToken(request));
  if (!identity) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [accounts, cafes] = await Promise.all([
    getAllAccounts(identity.userId),
    getAllCafes(identity.userId),
  ]);

  return NextResponse.json({
    accounts: accounts.map(({ id, password, nickname, isMain, role, excludeFromAutoComment }) => ({
      accountId: id,
      password,
      nickname,
      isMain,
      role,
      excludeFromAutoComment,
    })),
    cafes,
  });
};
