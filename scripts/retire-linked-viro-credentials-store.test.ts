import assert from 'node:assert/strict';
import test from 'node:test';
import type { mongo } from 'mongoose';
import { createRetirementStore } from './retire-linked-viro-credentials-store';
import { retireLinkedCredentials } from '../src/shared/lib/dabut-auth/retirement';

test('migration accesses only member and session collections and preserves common sessions', async () => {
  const selector = { userId: 'owner', dabutUserId: 'central' };
  const calls: string[] = [];
  const documents = [{ userId: 'owner', label: 'web-session', revoked: false }, { userId: 'owner', label: 'dabut-session', revoked: false }, { userId: 'other', label: 'desktop-login', revoked: false }];
  const users = {
    find: (filter: unknown) => {
      assert.deepEqual(filter, { $or: [{ userId: 'owner' }, { dabutUserId: 'central' }] });
      return { limit: () => ({ toArray: async () => [{ ...selector, password: 'synthetic-password', authProvider: 'legacy' }] }) };
    },
    updateOne: async (filter: unknown, update: unknown) => {
      calls.push('retire');
      assert.deepEqual(filter, selector);
      assert.deepEqual(update, { $set: { authProvider: 'dabut' }, $unset: { password: '' } });
      return { matchedCount: 1 };
    },
  };
  const sessions = {
    countDocuments: async () => 1,
    updateMany: async (filter: { userId: string; label: { $ne: string }; revoked: { $ne: boolean } }, update: unknown) => {
      calls.push('revoke');
      assert.deepEqual(update, { $set: { revoked: true } });
      let modifiedCount = 0;
      for (const row of documents) if (row.userId === filter.userId && row.label !== filter.label.$ne && row.revoked !== filter.revoked.$ne) { row.revoked = true; modifiedCount++; }
      return { modifiedCount };
    },
  };
  const database = { collection: (name: string) => {
    assert.ok(['users', 'agenttokens'].includes(name), 'operational collections must not be accessed');
    return name === 'users' ? users : sessions;
  } } as unknown as mongo.Db;
  const store = createRetirementStore(database);
  await retireLinkedCredentials(store, selector);
  assert.deepEqual(calls, []);
  const result = await retireLinkedCredentials(store, selector, true);
  assert.equal(result.sessionsRevoked, 1);
  assert.deepEqual(documents.map(({ revoked }) => revoked), [true, false, false]);
});
