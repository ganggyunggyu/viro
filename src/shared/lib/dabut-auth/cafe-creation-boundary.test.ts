import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCafeAction } from './testing/cafe-action-fixture';

const input = {
  ownerAccountId: 'another-account', name: '테스트 카페', slug: 'fixturecafe',
  presetKey: 'fixture', description: '테스트 설명', keywords: ['테스트'],
};

test('cafe creation requires authentication before looking up a Naver account', async (context) => {
  const { createCafeAction, state } = await loadCafeAction(context);
  await assert.rejects(createCafeAction(input), /로그인/);
  assert.deepEqual(state.filters, []);
  assert.equal(state.creates, 0);
});

test('cafe creation only accepts an active account belonging to the authenticated owner', async (context) => {
  const { createCafeAction, state } = await loadCafeAction(context);
  state.userId = 'linked-owner';
  assert.equal((await createCafeAction(input)).success, false);
  assert.deepEqual(state.filters, [{ userId: state.userId, accountId: input.ownerAccountId, isActive: true }]);
  assert.equal(state.creates, 0);
});
