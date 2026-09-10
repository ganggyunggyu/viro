'use server';

import { loginWithCredentials } from '@/shared/lib/agent-management/login-store';
import { connectDB } from '@/shared/lib/mongodb';
import { User } from '@/shared/models';
import { setCurrentUserId, getCurrentUserId } from '@/shared/config/user';
import { loginDabut } from '@/features/auth/dabut-actions';
import { changeAccountPassword, type ChangePasswordResult } from '@/features/auth/password-actions';

export interface LoginResult {
  success: boolean;
  error?: string;
  code?: string;
  user?: {
    userId: string;
    loginId: string;
    displayName: string;
  };
}

export const login = async (loginId: string, password: string): Promise<LoginResult> => {
  try {
    const user = await loginWithCredentials(loginId, password);
    if (!user) return { success: false, error: '아이디 또는 비밀번호를 확인하세요' };

    await setCurrentUserId(user.userId);

    return {
      success: true,
      user: {
        userId: user.userId,
        loginId: user.loginId,
        displayName: user.displayName,
      },
    };
  } catch {
    console.error('[AUTH] 로그인 실패');
    return { success: false, error: '로그인 처리 중 오류 발생' };
  }
};

export const logout = async (): Promise<void> => {
  await setCurrentUserId('');
};

export const getCurrentUser = async () => {
  try {
    const userId = await getCurrentUserId();

    if (!userId || userId === 'default-user') {
      return null;
    }

    await connectDB();
    const user = await User.findOne({ userId, isActive: true }).lean();

    if (!user) {
      return null;
    }

    return {
      userId: user.userId,
      loginId: user.loginId,
      displayName: user.displayName,
    };
  } catch {
    return null;
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> => {
  return changeAccountPassword(currentPassword, newPassword);
};

export const register = async (
  loginId: string,
  password: string,
  displayName: string
): Promise<LoginResult> => {
  return loginDabut({ username: loginId, password, label: displayName });
};
