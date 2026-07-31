import assert from 'node:assert/strict';
import test from 'node:test';

import type { NaverAccount } from '@/shared/lib/account-manager';
import {
  getCafeCommenterAccounts,
  getCafeWriterAccounts,
} from './cafe-account-policy';

const CHANEL_CAFE_ID = '25460974';
const SHOPPING_CAFE_ID = '25729954';
const HEALTH_CAFE_ID = '25227349';

const createAccount = (
  id: string,
  role: NaverAccount['role'] = 'writer',
  targetCafeIds?: string[],
): NaverAccount => ({
  id,
  password: 'secret',
  role,
  targetCafeIds,
});

const accountIds = (accounts: NaverAccount[]): string[] =>
  accounts.map(({ id }) => id);

test('luxury cafes use DB writer role accounts without fixed writer IDs', () => {
  const accounts = [
    createAccount('regular14631'),
    createAccount('compare14310'),
    createAccount('dhtksk1p', 'commenter'),
  ];

  assert.deepEqual(
    accountIds(getCafeWriterAccounts(accounts, CHANEL_CAFE_ID)),
    ['regular14631', 'compare14310'],
  );
  assert.deepEqual(
    accountIds(getCafeWriterAccounts(accounts, SHOPPING_CAFE_ID)),
    ['regular14631', 'compare14310'],
  );
});

test('health cafes use writer-role accounts and never promote commenters to writers', () => {
  const accounts = [
    createAccount('4giccokx'),
    createAccount('regular14631'),
    createAccount('compare14310'),
    createAccount('dhtksk1p', 'commenter'),
  ];

  assert.deepEqual(
    accountIds(getCafeWriterAccounts(accounts, HEALTH_CAFE_ID)),
    ['4giccokx', 'regular14631', 'compare14310'],
  );
});

test('writer policy applies explicit allowed account IDs after DB role filtering', () => {
  const accounts = [
    createAccount('regular14631'),
    createAccount('compare14310'),
    createAccount('dhtksk1p', 'commenter'),
  ];

  assert.deepEqual(
    accountIds(getCafeWriterAccounts(
      accounts,
      CHANEL_CAFE_ID,
      undefined,
      ['compare14310', 'dhtksk1p'],
    )),
    ['compare14310'],
  );
});

test('unknown cafe policy returns writer-role accounts only', () => {
  const accounts = [
    createAccount('regular14631'),
    createAccount('dhtksk1p', 'commenter'),
  ];

  assert.deepEqual(
    accountIds(getCafeWriterAccounts(accounts, 'unknown')),
    ['regular14631'],
  );
});

test('commenter policy can exclude the writer and apply allowed account IDs', () => {
  const accounts = [
    createAccount('regular14631'),
    createAccount('dhtksk1p', 'commenter'),
    createAccount('orangeswan630', 'commenter'),
  ];

  assert.deepEqual(
    accountIds(
      getCafeCommenterAccounts(
        accounts,
        HEALTH_CAFE_ID,
        undefined,
        'regular14631',
        ['regular14631', 'orangeswan630'],
      ),
    ),
    ['orangeswan630'],
  );
});

test('cafe policy excludes explicitly mapped accounts from other cafes and keeps empty mappings global', () => {
  const accounts = [
    createAccount('cafe-a-writer', 'writer', ['A']),
    createAccount('global-writer', 'writer', []),
    createAccount('legacy-writer'),
    createAccount('cafe-a-commenter', 'commenter', ['A']),
    createAccount('global-commenter', 'commenter', []),
  ];

  assert.deepEqual(
    accountIds(getCafeWriterAccounts(accounts, 'B')),
    ['global-writer', 'legacy-writer'],
  );
  assert.deepEqual(
    accountIds(getCafeCommenterAccounts(accounts, 'B')),
    ['global-writer', 'legacy-writer', 'global-commenter'],
  );
});

test('cafe policy matches stored cafe slugs independently from numeric cafe IDs', () => {
  const accounts = [
    createAccount('meal-writer', 'writer', ['mealtalkdht']),
    createAccount('global-writer'),
  ];

  assert.deepEqual(
    accountIds(getCafeWriterAccounts(accounts, '31750114', 'mealtalkdht')),
    ['meal-writer', 'global-writer'],
  );
  assert.deepEqual(
    accountIds(getCafeWriterAccounts(accounts, '99999999', 'other')),
    ['global-writer'],
  );
});
