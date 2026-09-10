export interface DabutIdentity {
  service: 'viro';
  user: { id: string; username: string; label: string; isActive: boolean };
  role: 'member' | 'admin';
  expiresAt: string;
}

export interface LinkedUser {
  userId: string;
  loginId: string;
  displayName: string;
  isActive: boolean;
  dabutUserId?: string;
}

export interface LinkInput {
  token: string;
  legacyLoginId?: string;
  legacyPassword?: string;
}

export interface IdentityStore {
  findLinked: (id: string) => Promise<LinkedUser | null>;
  findLogin: (loginId: string) => Promise<LinkedUser | null>;
  verifyLegacy: (loginId: string, password: string) => Promise<{ userId: string } | null>;
  link: (userId: string, dabutUserId: string) => Promise<LinkedUser | null>;
  create: (identity: DabutIdentity) => Promise<LinkedUser>;
}

export interface DabutAuthError extends Error { status: number; code: string }
export const authError = (status: number, code: string, message: string): DabutAuthError =>
  Object.assign(new Error(message), { status, code });
export const isAuthError = (error: unknown): error is DabutAuthError =>
  error instanceof Error && 'status' in error && 'code' in error;
