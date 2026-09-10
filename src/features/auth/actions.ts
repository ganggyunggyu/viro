'use server';

import { loginWithCredentials } from '@/shared/lib/agent-management/login-store';
import { connectDB } from '@/shared/lib/mongodb';
import { User } from '@/shared/models';
import { setCurrentUserId, getCurrentUserId } from '@/shared/config/user';
import { hashPassword, isHashedPassword, verifyPassword } from '@/shared/lib/password';

export interface LoginResult {
  success: boolean;
  error?: string;
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
    await connectDB();
    const userId = await getCurrentUserId();

    if (!userId || userId === 'default-user') {
      return null;
    }

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

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
}

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> => {
  try {
    await connectDB();

    const userId = await getCurrentUserId();
    if (!userId || userId === 'default-user') {
      return { success: false, error: '로그인이 필요합니다' };
    }

    const user = await User.findOne({ userId, isActive: true });
    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없음' };
    }

    const currentMatches = isHashedPassword(user.password)
      ? verifyPassword(currentPassword, user.password)
      : user.password === currentPassword;

    if (!currentMatches) {
      return { success: false, error: '현재 비밀번호가 일치하지 않음' };
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: '새 비밀번호는 4자 이상이어야 함' };
    }

    user.password = hashPassword(newPassword);
    await user.save();

    return { success: true };
  } catch (error) {
    console.error('[AUTH] 비밀번호 변경 실패:', error);
    return { success: false, error: '비밀번호 변경 중 오류 발생' };
  }
};

export const register = async (
  loginId: string,
  password: string,
  displayName: string
): Promise<LoginResult> => {
  try {
    await connectDB();

    const existing = await User.findOne({ loginId });
    if (existing) {
      return { success: false, error: '이미 존재하는 아이디' };
    }

    const userId = `user-${Date.now()}`;

    await User.create({
      userId,
      loginId,
      password: hashPassword(password),
      displayName,
    });

    await setCurrentUserId(userId);

    return {
      success: true,
      user: { userId, loginId, displayName },
    };
  } catch (error) {
    console.error('[AUTH] 회원가입 실패:', error);
    return { success: false, error: '회원가입 처리 중 오류 발생' };
  }
};
