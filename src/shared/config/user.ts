import { cookies } from 'next/headers';
import { authenticateAgentToken, generateAgentToken, hashAgentToken } from '@/shared/lib/agent-broker/auth';
import { AgentToken } from '@/shared/models/agent-token';
import { connectDB } from '@/shared/lib/mongodb';

export const DEFAULT_USER_ID = 'default-user';
export const USER_COOKIE_NAME = 'cafe-bot-user-id';
const MAX_AGE = 60 * 60 * 24 * 30;

export const getCurrentUserId = async (): Promise<string> => {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(USER_COOKIE_NAME)?.value;
    if (!session) return DEFAULT_USER_ID;
    return (await authenticateAgentToken(session))?.userId ?? DEFAULT_USER_ID;
  } catch { return DEFAULT_USER_ID; }
};

export const setCurrentUserId = async (userId: string): Promise<void> => {
  const cookieStore = await cookies();
  await connectDB();
  const previous = cookieStore.get(USER_COOKIE_NAME)?.value;
  if (previous) await AgentToken.updateOne({ tokenHash: hashAgentToken(previous), label: 'web-session' }, { $set: { revoked: true } });
  const session = userId ? generateAgentToken() : '';
  if (userId) await AgentToken.create({ userId, tokenHash: hashAgentToken(session), label: 'web-session', expiresAt: new Date(Date.now() + MAX_AGE * 1000) });
  // 쿠키 값을 userId로 신뢰하지 않는다. 기존 ID 쿠키는 재로그인해야 한다.
  cookieStore.set(USER_COOKIE_NAME, session, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: userId ? MAX_AGE : 0,
  });
};
