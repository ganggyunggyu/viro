import assert from 'node:assert/strict';
import { authenticateLogin } from '../src/shared/lib/agent-management/login-service';
import { hashPassword, isHashedPassword } from '../src/shared/lib/password';

const run = async () => {
  const user = { userId: 'u', loginId: 'member', displayName: '회원', password: 'synthetic-password' };
  let migrated = '';
  const store = { findActive: async (id: string) => id === 'member' ? user : null,
    updatePassword: async (_id: string, hash: string) => { migrated = hash; } };
  assert.equal(await authenticateLogin(store, 'missing', 'synthetic-password'), null);
  assert.equal(await authenticateLogin(store, 'member', 'wrong'), null);
  assert.equal(migrated, '');
  const result = await authenticateLogin(store, ' member ', 'synthetic-password');
  assert.deepEqual(result, { userId: 'u', loginId: 'member', displayName: '회원' });
  assert.ok(isHashedPassword(migrated));
  user.password = hashPassword('synthetic-password'); migrated = '';
  assert.ok(await authenticateLogin(store, 'member', 'synthetic-password'));
  assert.equal(migrated, '');
  assert.equal(await authenticateLogin(store, {}, 'synthetic-password'), null);
  console.log('agent login harness passed');
};
void run();
