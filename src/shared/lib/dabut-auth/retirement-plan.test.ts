import assert from 'node:assert/strict';
import test from 'node:test';
import { retireLinkedCredentials, type RetirementStore } from './retirement';

const selector = { userId: 'owner', dabutUserId: 'central' };
const fixture = () => {
  const member = { ...selector, password: 'synthetic-private-password', authProvider: 'legacy' };
  let sessions = 2;
  const writes: string[] = [];
  const store: RetirementStore = {
    find: async () => [member], countSessions: async () => sessions,
    retire: async () => { writes.push('member'); member.password = ''; member.authProvider = 'dabut'; return true; },
    revoke: async () => { writes.push('sessions'); const count = sessions; sessions = 0; return count; },
  };
  return { store, writes, member };
};

test('default retirement is a credential-safe plan with no writes', async () => {
  const { store, writes } = fixture();
  const result = await retireLinkedCredentials(store, selector);
  assert.deepEqual(writes, []);
  assert.deepEqual(result, { ...selector, mode: 'dry-run', credentialsPending: true, legacySessions: 2, credentialsRetired: false, sessionsRevoked: 0 });
  assert.equal(JSON.stringify(result).includes('synthetic-private-password'), false);
});

test('explicit retirement preserves owner mapping and repeated apply makes no further changes', async () => {
  const { store, member, writes } = fixture();
  const result = await retireLinkedCredentials(store, selector, true);
  assert.equal(result.credentialsRetired, true);
  assert.equal(result.sessionsRevoked, 2);
  assert.equal(member.userId, selector.userId);
  assert.equal(member.dabutUserId, selector.dabutUserId);
  writes.length = 0;
  const repeated = await retireLinkedCredentials(store, selector, true);
  assert.equal(repeated.credentialsPending, false);
  assert.equal(repeated.sessionsRevoked, 0);
  assert.deepEqual(writes, []);
});

test('missing, mismatched or duplicate mappings reject without changing data', async () => {
  for (const found of [[], [{ userId: 'other', dabutUserId: 'central' }], [{ ...selector }, { ...selector }]]) {
    const { store, writes } = fixture();
    store.find = async () => found;
    await assert.rejects(retireLinkedCredentials(store, selector, true), /mapping/);
    assert.deepEqual(writes, []);
  }
});

test('a changed member mapping blocks session retirement', async () => {
  const { store, writes } = fixture();
  store.retire = async () => false;
  await assert.rejects(retireLinkedCredentials(store, selector, true), /mapping/);
  assert.deepEqual(writes, []);
});
