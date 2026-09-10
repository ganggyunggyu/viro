import { hashPassword, isHashedPassword, verifyPassword } from '@/shared/lib/password';

export interface LoginAccount {
  userId: string;
  loginId: string;
  displayName: string;
  password: string;
  dabutUserId?: string;
  authProvider?: 'legacy' | 'dabut';
}

interface LoginStore {
  findActive: (loginId: string) => Promise<LoginAccount | null>;
  updatePassword: (userId: string, password: string) => Promise<void>;
}

/** 웹과 데스크톱의 자격 검증·기존 비밀번호 마이그레이션을 한 곳에서 처리한다. */
export const authenticateLogin = async (
  store: LoginStore, loginId: unknown, password: unknown, options: { forAccountLink?: boolean } = {},
) => {
  if (typeof loginId !== 'string' || typeof password !== 'string'
    || !loginId.trim() || !password || loginId.length > 100 || password.length > 1024) return null;
  const account = await store.findActive(loginId.trim());
  if (!account) return null;
  if (!options.forAccountLink && (account.dabutUserId || account.authProvider === 'dabut')) return null;
  const hashed = isHashedPassword(account.password);
  if (!(hashed ? verifyPassword(password, account.password) : account.password === password)) return null;
  if (!hashed) await store.updatePassword(account.userId, hashPassword(password));
  const { userId, loginId: name, displayName } = account;
  return { userId, loginId: name, displayName };
};
