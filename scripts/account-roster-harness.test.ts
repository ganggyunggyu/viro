import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACCOUNT_ROSTER,
  createAccountRosterAudit,
  type DbAccountSnapshot,
} from './account-roster-harness';

const toDbSnapshots = (): DbAccountSnapshot[] =>
  ACCOUNT_ROSTER.map((account) => ({ ...account }));

test('ACCOUNT_ROSTER keeps active writer and commenter pools fixed', () => {
  const audit = createAccountRosterAudit(ACCOUNT_ROSTER, toDbSnapshots());

  assert.equal(audit.ok, true);
  assert.equal(audit.activeWriterIds.length, 5);
  assert.equal(audit.activeCommenterIds.length, 14);
  assert.deepEqual(audit.inactiveRosterIds, ['loand3324']);
  assert.equal(audit.activeWriterIds.includes('loand3324'), false);
  assert.equal(audit.activeCommenterIds.includes('loand3324'), false);
});

test('createAccountRosterAudit detects account field drift', () => {
  const dbAccounts = toDbSnapshots().map((account) =>
    account.accountId === 'regular14631'
      ? { ...account, role: 'commenter' }
      : account,
  );
  const audit = createAccountRosterAudit(ACCOUNT_ROSTER, dbAccounts);

  assert.equal(audit.ok, false);
  assert.deepEqual(audit.mismatches, ['regular14631:role']);
});

test('createAccountRosterAudit detects extra active DB accounts', () => {
  const audit = createAccountRosterAudit(ACCOUNT_ROSTER, [
    ...toDbSnapshots(),
    {
      accountId: 'extra-active',
      nickname: 'extra',
      password: 'secret',
      role: 'commenter',
      isActive: true,
    },
  ]);

  assert.equal(audit.ok, false);
  assert.deepEqual(audit.extraActiveIds, ['extra-active']);
});
