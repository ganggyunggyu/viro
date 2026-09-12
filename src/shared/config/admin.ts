import { cookies } from 'next/headers';
import { getCurrentUserId, USER_COOKIE_NAME } from '@/shared/config/user';
import { dabutClient, isServiceToken, authError } from '@/shared/lib/dabut-auth';

export const requireServiceAdmin = async (): Promise<void> => {
  await getCurrentUserId();
  const token = (await cookies()).get(USER_COOKIE_NAME)?.value;
  if (!isServiceToken(token)) throw authError(403, 'admin_required', '다붓 서비스 관리자 권한이 필요합니다.');
  const identity = await dabutClient.verify(token);
  if (identity.role !== 'admin') throw authError(403, 'admin_required', '다붓 서비스 관리자 권한이 필요합니다.');
};
