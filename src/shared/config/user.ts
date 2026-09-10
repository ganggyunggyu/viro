import { cookies } from 'next/headers';
import { authenticateAgentToken, generateAgentToken, hashAgentToken } from '@/shared/lib/agent-broker/auth';
import { AgentToken } from '@/shared/models/agent-token';
import { connectDB } from '@/shared/lib/mongodb';
import { dabutClient, isServiceToken } from '@/shared/lib/dabut-auth';
import { DABUT_COOKIE_NAME, serviceCookieOptions } from '@/shared/lib/dabut-auth/cookie';
import { AuthenticationRequiredError } from './session-error';

export const DEFAULT_USER_ID = 'default-user';
export const USER_COOKIE_NAME = DABUT_COOKIE_NAME;
const MAX_AGE = 60 * 60 * 24 * 30;

const revokePreviousSession = async (previous?: string): Promise<void> => {
  if (!previous) return;
  if (isServiceToken(previous)) {
    await connectDB();
    await AgentToken.updateOne({ tokenHash: hashAgentToken(previous), label: 'dabut-session' }, { $set: { revoked: true } });
    try { await dabutClient.revoke(previous); } catch { console.error('[AUTH] 공통 세션 폐기 요청 실패'); }
    return;
  }
  await connectDB();
  await AgentToken.updateOne({ tokenHash: hashAgentToken(previous), label: 'web-session' }, { $set: { revoked: true } });
};

export const setDabutSession = async (token: string, expiresAt: string): Promise<void> => {
  const cookieStore = await cookies();
  const previous = cookieStore.get(USER_COOKIE_NAME)?.value;
  if (previous !== token) await revokePreviousSession(previous);
  cookieStore.set(USER_COOKIE_NAME, token, serviceCookieOptions(expiresAt));
};

export const getCurrentUserId = async (): Promise<string> => {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(USER_COOKIE_NAME)?.value;
    const userId = session ? (await authenticateAgentToken(session))?.userId : undefined;
    if (!userId) throw new AuthenticationRequiredError();
    return userId;
  } catch { throw new AuthenticationRequiredError(); }
};

export const setCurrentUserId = async (userId: string): Promise<void> => {
  const cookieStore = await cookies();
  const previous = cookieStore.get(USER_COOKIE_NAME)?.value;
  await revokePreviousSession(previous);
  const session = userId ? generateAgentToken() : '';
  if (userId) {
    await connectDB();
    await AgentToken.create({ userId, tokenHash: hashAgentToken(session), label: 'web-session', expiresAt: new Date(Date.now() + MAX_AGE * 1000) });
  }
  // 쿠키 값을 userId로 신뢰하지 않는다. 기존 ID 쿠키는 재로그인해야 한다.
  cookieStore.set(USER_COOKIE_NAME, session, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: userId ? MAX_AGE : 0,
  });
};
