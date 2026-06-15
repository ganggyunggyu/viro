import assert from 'node:assert/strict';
import test from 'node:test';

import type { NaverAccount } from '@/shared/lib/account-manager';
import {
  getCafeCommenterAccounts,
  getCafeWriterAccounts,
  LUXURY_CAFE_WRITER_ACCOUNT_IDS,
} from './cafe-account-policy';

const CHANEL_CAFE_ID = '25460974';
const SHOPPING_CAFE_ID = '25729954';
const HEALTH_CAFE_ID = '25227349';

const createAccount = (
  id: string,
  role: NaverAccount['role'] = 'writer',
): NaverAccount => ({
  id,
  password: 'secret',
  role,
});

const accountIds = (accounts: NaverAccount[]): string[] =>
  accounts.map(({ id }) => id);

test('luxury cafes use only the fixed Chanel and shopping writer pool', () => {
  const accounts = [
    ...LUXURY_CAFE_WRITER_ACCOUNT_IDS.map((id) => createAccount(id)),
    createAccount('regular14631'),
    createAccount('compare14310'),
    createAccount('dhtksk1p', 'commenter'),
  ];

  assert.deepEqual(
    accountIds(getCafeWriterAccounts(accounts, CHANEL_CAFE_ID)),
    [...LUXURY_CAFE_WRITER_ACCOUNT_IDS],
  );
  assert.deepEqual(
    accountIds(getCafeWriterAccounts(accounts, SHOPPING_CAFE_ID)),
    [...LUXURY_CAFE_WRITER_ACCOUNT_IDS],
  );
});

test('health cafes exclude luxury writers and never promote commenters to writers', () => {
  const accounts = [
    createAccount('4giccokx'),
    createAccount('regular14631'),
    createAccount('compare14310'),
    createAccount('dhtksk1p', 'commenter'),
  ];

  assert.deepEqual(
    accountIds(getCafeWriterAccounts(accounts, HEALTH_CAFE_ID)),
    ['regular14631', 'compare14310'],
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
        'regular14631',
        ['regular14631', 'orangeswan630'],
      ),
    ),
    ['orangeswan630'],
  );
});
