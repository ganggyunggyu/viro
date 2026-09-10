import assert from 'node:assert/strict';
import test from 'node:test';
import { linkDabutIdentity } from '@/shared/lib/dabut-auth/link';
import type { DabutIdentity, IdentityStore, LinkedUser } from '@/shared/lib/dabut-auth/contracts';

const identity: DabutIdentity = {
  service: 'viro', user: { id: 'central-1', username: 'same-name', label: '이름', isActive: true },
  role: 'member', expiresAt: '2099-01-01T00:00:00Z',
};
const fixture = (initial: LinkedUser[] = []) => {
  const users = [...initial];
  let passwordsChecked = 0;
  const store: IdentityStore = {
    findLinked: async (id) => users.find((user) => user.dabutUserId === id) ?? null,
    findLogin: async (name) => users.find((user) => user.loginId === name) ?? null,
    verifyLegacy: async (name, password) => {
      passwordsChecked++;
      return password === 'verified-password' ? users.find((user) => user.loginId === name) ?? null : null;
    },
    link: async (userId, dabutUserId) => {
      const user = users.find((item) => item.userId === userId);
      if (!user || (user.dabutUserId && user.dabutUserId !== dabutUserId)) return null;
      Object.assign(user, { dabutUserId });
      return user;
    },
    create: async ({ user }) => {
      const created = { userId: `dabut-${user.id}`, dabutUserId: user.id, loginId: user.username, displayName: user.label, isActive: true };
      users.push(created);
      return created;
    },
  };
  return { store, users, checked: () => passwordsChecked };
};
const legacy = { userId: 'existing-owner', loginId: 'same-name', displayName: '기존', isActive: true };
const input = { token: 'ds1_test' };

test('new common member gets a central ID mapping without a local password', async () => {
  const { store, users } = fixture();
  const user = await linkDabutIdentity(store, identity, input);
  assert.equal(user?.userId, 'dabut-central-1');
  assert.equal(users.length, 1);
  assert.equal('password' in users[0], false);
});

test('matching names require explicit ownership verification and preserve existing data', async () => {
  const { store, users, checked } = fixture([{ ...legacy }]);
  await assert.rejects(linkDabutIdentity(store, identity, input), { status: 409, code: 'account_link_required' });
  assert.equal(users[0].dabutUserId, undefined);
  assert.equal(checked(), 0);
  await assert.rejects(linkDabutIdentity(store, identity, { ...input, legacyLoginId: 'same-name', legacyPassword: 'wrong' }), { status: 401 });
  const user = await linkDabutIdentity(store, identity, { ...input, legacyLoginId: 'same-name', legacyPassword: 'verified-password' });
  assert.equal(user?.userId, legacy.userId);
  assert.equal(users.length, 1);
  assert.equal((await linkDabutIdentity(store, identity, input))?.userId, legacy.userId);
});

test('cannot relink another common member or inactive local account', async () => {
  for (const user of [{ ...legacy, dabutUserId: 'someone-else' }, { ...legacy, isActive: false }]) {
    const { store } = fixture([user]);
    await assert.rejects(linkDabutIdentity(store, identity, { ...input, legacyLoginId: 'same-name', legacyPassword: 'verified-password' }));
  }
});

test('incomplete linking credentials do not create or merge accounts', async () => {
  const { store, users } = fixture();
  await assert.rejects(linkDabutIdentity(store, identity, { ...input, legacyLoginId: 'same-name' }), { status: 400 });
  assert.equal(users.length, 0);
});
