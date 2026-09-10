'use server';

import { connectDB } from '@/shared/lib/mongodb';
import { User } from '@/shared/models/user';
import { getCurrentUserId } from '@/shared/config/user';
import { hashPassword, isHashedPassword, verifyPassword } from '@/shared/lib/password';

export interface ChangePasswordResult { success: boolean; error?: string }

export const changeAccountPassword = async (currentPassword: string, newPassword: string): Promise<ChangePasswordResult> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId || userId === 'default-user') return { success: false, error: '로그인이 필요합니다' };
    await connectDB();
    const user = await User.findOne({ userId, isActive: true });
    if (!user) return { success: false, error: '사용자를 찾을 수 없음' };
    if (user.dabutUserId) return { success: false, error: '연결된 계정의 비밀번호는 다붓에서 변경하세요.' };
    const currentMatches = isHashedPassword(user.password)
      ? verifyPassword(currentPassword, user.password) : user.password === currentPassword;
    if (!currentMatches) return { success: false, error: '현재 비밀번호가 일치하지 않음' };
    if (!newPassword || newPassword.length < 4) return { success: false, error: '새 비밀번호는 4자 이상이어야 함' };
    user.password = hashPassword(newPassword);
    await user.save();
    return { success: true };
  } catch {
    console.error('[AUTH] 비밀번호 변경 실패');
    return { success: false, error: '비밀번호 변경 중 오류 발생' };
  }
};
