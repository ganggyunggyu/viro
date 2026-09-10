import { authError, isAuthError, type DabutIdentity } from '@/shared/lib/dabut-auth/contracts';

export type IdentityRequest = (method: 'GET' | 'POST' | 'DELETE', path: string, token: string, body?: unknown) => Promise<unknown>;
export const isServiceToken = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('ds1_') && value.length > 4 && value.length <= 512;
const object = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const readIdentity = (value: unknown): DabutIdentity => {
  const { service, user: rawUser, role, expiresAt } = object(value);
  const { id, username, label, isActive } = object(rawUser);
  if (service !== 'viro' || (role !== 'member' && role !== 'admin') || isActive !== true
    || typeof id !== 'string' || !id || typeof username !== 'string' || !username
    || typeof expiresAt !== 'string' || !(Date.parse(expiresAt) > Date.now())) {
    throw authError(401, 'invalid_identity', '다붓 계정 인증이 만료되었거나 사용할 수 없습니다.');
  }
  return { service, user: { id, username, label: typeof label === 'string' ? label : '', isActive }, role, expiresAt };
};

export const createDabutClient = (request: IdentityRequest) => {
  const call: IdentityRequest = async (...args) => {
    try { return await request(...args); } catch (error) {
      if (isAuthError(error)) throw error;
      throw authError(503, 'identity_unavailable', '다붓 인증 서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요.');
    }
  };
  const verify = async (token: string): Promise<DabutIdentity> => {
    if (!isServiceToken(token)) throw authError(401, 'invalid_token', '다붓 서비스 로그인이 필요합니다.');
    return readIdentity(await call('GET', '/auth/app/service-sessions/me', token));
  };
  const issue = async (accessToken: string) => {
    const result = object(await call('POST', '/auth/app/service-sessions', accessToken, { service: 'viro' }));
    if (!isServiceToken(result.token)) throw authError(503, 'invalid_session', '다붓 로그인 응답을 확인할 수 없습니다.');
    return { ...readIdentity(result), token: result.token };
  };
  const login = async (username: string, password: string, label?: string) => {
    if (!username.trim() || !password || username.length > 100 || password.length > 1024) {
      throw authError(400, 'invalid_credentials', '다붓 아이디와 비밀번호를 입력하세요.');
    }
    const path = label === undefined ? 'login' : 'signup';
    const result = object(await call('POST', `/auth/app/${path}`, '', { username: username.trim(), password, ...(label === undefined ? {} : { label }) }));
    if (typeof result.access_token !== 'string' || !result.access_token) {
      throw authError(503, 'invalid_session', '다붓 로그인 응답을 확인할 수 없습니다.');
    }
    return issue(result.access_token);
  };
  const revoke = async (token: string) => {
    if (isServiceToken(token)) await call('DELETE', '/auth/app/service-sessions/current', token);
  };
  return { verify, login, revoke };
};
