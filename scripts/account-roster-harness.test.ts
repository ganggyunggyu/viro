import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAccountRosterAudit,
  type DbAccountSnapshot,
  type DbCafeSnapshot,
} from './account-roster-harness';

const cafes = (): DbCafeSnapshot[] => [
  { cafeId: '25460974', name: '샤넬오픈런', isActive: true },
  { cafeId: '25729954', name: '쇼핑지름신', isActive: true },
  { cafeId: '25227349', name: '건강관리소', isActive: true },
];

test('createAccountRosterAudit passes when required cafe writer policies are populated', () => {
  const accounts: DbAccountSnapshot[] = [
    { accountId: '4giccokx', role: 'writer', isActive: true },
    { accountId: 'compare14310', role: 'writer', isActive: true },
    { accountId: 'dhtksk1p', role: 'commenter', isActive: true },
    { accountId: 'old-writer', role: 'writer', isActive: false },
  ];
  const audit = createAccountRosterAudit(accounts, cafes());

  assert.equal(audit.ok, true);
  assert.deepEqual(audit.activeWriterIds, ['4giccokx', 'compare14310']);
  assert.deepEqual(audit.activeCommenterIds, ['dhtksk1p']);
  assert.deepEqual(audit.inactiveIds, ['old-writer']);
  assert.deepEqual(audit.emptyWriterCafeNames, []);
  assert.deepEqual(
    audit.cafeWriterPolicies.find(({ cafeName }) => cafeName === '샤넬오픈런')?.writerAccountIds,
    ['4giccokx'],
  );
});

test('createAccountRosterAudit fails when required luxury cafes have no writer account', () => {
  const accounts: DbAccountSnapshot[] = [
    { accountId: 'compare14310', role: 'writer', isActive: true },
    { accountId: 'dhtksk1p', role: 'commenter', isActive: true },
  ];
  const audit = createAccountRosterAudit(accounts, cafes());

  assert.equal(audit.ok, false);
  assert.deepEqual(audit.emptyWriterCafeNames, ['샤넬오픈런', '쇼핑지름신']);
});

test('createAccountRosterAudit fails on active accounts without a known role', () => {
  const accounts: DbAccountSnapshot[] = [
    { accountId: '4giccokx', role: 'writer', isActive: true },
    { accountId: 'roleless', isActive: true },
  ];
  const audit = createAccountRosterAudit(accounts, cafes());

  assert.equal(audit.ok, false);
  assert.deepEqual(audit.unknownRoleIds, ['roleless']);
});
