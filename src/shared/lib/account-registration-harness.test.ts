import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAccountRegistration,
  type AccountRegistrationRecord,
} from './account-registration-harness';

const createInput = (overrides: Partial<AccountRegistrationRecord> = {}): AccountRegistrationRecord => ({
  userId: 'user-1',
  accountId: 'account-1',
  password: 'password-1',
  isMain: false,
  excludeFromAutoComment: false,
  ...overrides,
});

test('account registration rejects missing required fields before reading the repository', async () => {
  let readCount = 0;
  const register = createAccountRegistration({
    findActive: async () => {
      readCount += 1;
      return null;
    },
    upsert: async () => undefined,
  });

  const missingAccountId = await register(createInput({ accountId: '  ' }));
  const missingPassword = await register(createInput({ password: '' }));

  assert.deepEqual(missingAccountId, { success: false, error: '아이디와 비밀번호를 입력해주세요' });
  assert.deepEqual(missingPassword, { success: false, error: '아이디와 비밀번호를 입력해주세요' });
  assert.equal(readCount, 0);
});

test('account registration keeps active duplicate accounts blocked', async () => {
  let upsertCount = 0;
  const register = createAccountRegistration({
    findActive: async () => ({ accountId: 'account-1' }),
    upsert: async () => {
      upsertCount += 1;
    },
  });

  const result = await register(createInput());

  assert.deepEqual(result, { success: false, error: '이미 존재하는 계정입니다' });
  assert.equal(upsertCount, 0);
});

test('account registration reactivates and refreshes a soft-deleted account with the same id', async () => {
  let stored = createInput({ password: 'old-password', isActive: false });
  const register = createAccountRegistration({
    findActive: async ({ userId, accountId }) =>
      stored.userId === userId && stored.accountId === accountId && stored.isActive
        ? stored
        : null,
    upsert: async ({ filter, set }) => {
      assert.deepEqual(filter, { userId: 'user-1', accountId: 'account-1' });
      stored = { ...stored, ...set };
    },
  });

  const result = await register(createInput({ password: 'new-password', nickname: '새 별명' }));

  assert.deepEqual(result, { success: true });
  assert.equal(stored.isActive, true);
  assert.equal(stored.password, 'new-password');
  assert.equal(stored.nickname, '새 별명');
});
