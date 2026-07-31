import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCafeRegistrationUpdate,
  createCafeRegistration,
  type CafeRegistrationRecord,
} from './cafe-registration-harness';

const createInput = (overrides: Partial<CafeRegistrationRecord> = {}): CafeRegistrationRecord => ({
  userId: 'user-1',
  cafeId: '12345',
  cafeUrl: 'test-cafe',
  menuId: '1',
  name: '테스트 카페',
  categories: ['자유게시판'],
  isDefault: false,
  ...overrides,
});

test('cafe registration keeps active duplicates blocked', async () => {
  let upsertCount = 0;
  const register = createCafeRegistration({
    findActive: async () => ({ cafeId: '12345' }),
    upsert: async () => {
      upsertCount += 1;
    },
  });

  const result = await register(createInput());

  assert.deepEqual(result, { success: false, error: '이미 존재하는 카페입니다' });
  assert.equal(upsertCount, 0);
});

test('cafe registration reactivates and refreshes a soft-deleted cafe with the same id', async () => {
  let stored = createInput({ cafeUrl: 'old-cafe', name: '이전 이름', isActive: false });
  const register = createCafeRegistration({
    findActive: async ({ userId, cafeId }) =>
      stored.userId === userId && stored.cafeId === cafeId && stored.isActive
        ? stored
        : null,
    upsert: async ({ filter, update }) => {
      assert.deepEqual(filter, { userId: 'user-1', cafeId: '12345' });
      stored = { ...stored, ...update.$set };
    },
  });

  const result = await register(createInput({ cafeUrl: 'new-cafe', name: '새 이름' }));

  assert.deepEqual(result, { success: true });
  assert.equal(stored.isActive, true);
  assert.equal(stored.cafeUrl, 'new-cafe');
  assert.equal(stored.name, '새 이름');
});

test('created cafe DB registration uses the same active upsert contract', () => {
  const update = buildCafeRegistrationUpdate(createInput({
    categoryMenuIds: { 자유게시판: '7' },
    commentableMenuIds: [7],
    ownerAccountId: 'owner-1',
  }), { preserveExistingDefault: true });

  assert.equal(update.$set.isActive, true);
  assert.deepEqual(update.$set.categoryMenuIds, { 자유게시판: '7' });
  assert.deepEqual(update.$set.commentableMenuIds, [7]);
  assert.equal(update.$set.ownerAccountId, 'owner-1');
  assert.deepEqual(update.$setOnInsert, { isDefault: false });
});
