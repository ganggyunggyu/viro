'use server';

import { connectDabutAccount, dabutClient, isAuthError } from '@/shared/lib/dabut-auth';
import { setDabutSession } from '@/shared/config/user';
import type { LoginResult } from '@/features/auth/actions';

export interface DabutLoginInput {
  username: string;
  password: string;
  label?: string;
  legacyLoginId?: string;
  legacyPassword?: string;
}

export const loginDabut = async (input: DabutLoginInput): Promise<LoginResult> => {
  let issuedToken = '';
  try {
    const { username, password, label, legacyLoginId, legacyPassword } = input;
    const session = await dabutClient.login(username, password, label);
    issuedToken = session.token;
    const result = await connectDabutAccount({ token: session.token, legacyLoginId, legacyPassword });
    await setDabutSession(result.token, result.expiresAt);
    const { userId, loginId, displayName } = result.user;
    return { success: true, user: { userId, loginId, displayName } };
  } catch (error) {
    if (issuedToken) {
      try { await dabutClient.revoke(issuedToken); } catch { console.error('[AUTH] 로그인 실패 세션 정리 요청 실패'); }
    }
    return { success: false, error: isAuthError(error) ? error.message : '다붓 로그인 연결을 완료하지 못했습니다.',
      code: isAuthError(error) ? error.code : 'service_unavailable' };
  }
};
