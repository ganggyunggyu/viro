import { authError, type DabutIdentity, type IdentityStore, type LinkedUser, type LinkInput } from '@/shared/lib/dabut-auth/contracts';

const conflict = () => authError(409, 'account_link_required', '기존 바이로 계정으로 본인 확인 후 연결해 주세요.');
const ensureActive = (user: LinkedUser): LinkedUser => {
  if (!user.isActive) throw authError(403, 'account_inactive', '비활성화된 계정입니다.');
  return user;
};

export const linkDabutIdentity = async (
  store: IdentityStore, identity: DabutIdentity, input: LinkInput,
): Promise<LinkedUser> => {
  const { legacyLoginId, legacyPassword } = input;
  if (Boolean(legacyLoginId) !== Boolean(legacyPassword)) {
    throw authError(400, 'invalid_link_input', '기존 아이디와 비밀번호를 함께 입력하세요.');
  }
  const linked = await store.findLinked(identity.user.id);
  if (linked) {
    if (legacyLoginId && linked.loginId !== legacyLoginId.trim()) throw conflict();
    return ensureActive(linked);
  }
  if (legacyLoginId && legacyPassword) {
    const existing = await store.findLogin(legacyLoginId.trim());
    const verified = await store.verifyLegacy(legacyLoginId, legacyPassword);
    if (!existing || !verified || existing.userId !== verified.userId) {
      throw authError(401, 'legacy_auth_failed', '기존 바이로 아이디 또는 비밀번호를 확인하세요.');
    }
    ensureActive(existing);
    if (existing.dabutUserId && existing.dabutUserId !== identity.user.id) throw conflict();
    const result = await store.link(existing.userId, identity.user.id);
    if (!result) throw conflict();
    return result;
  }
  if (await store.findLogin(identity.user.username)) throw conflict();
  try {
    return await store.create(identity);
  } catch (error) {
    if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 11000) throw error;
    const existing = await store.findLinked(identity.user.id);
    if (existing) return ensureActive(existing);
    throw conflict();
  }
};
