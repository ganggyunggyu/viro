import assert from 'node:assert/strict';
import test from 'node:test';
import { identityStore } from '@/shared/lib/dabut-auth/store';
import { linkDabutIdentity } from '@/shared/lib/dabut-auth/link';
import { User } from '@/shared/models/user';
import { AgentToken } from '@/shared/models/agent-token';
import { isolateSession } from './testing/session-fixture';
import type { DabutIdentity } from './contracts';

const identity: DabutIdentity = { service: 'viro', user: { id: 'central', username: 'name', label: 'Member', isActive: true }, role: 'member', expiresAt: '2099-01-01T00:00:00Z' };
const linked = { userId: 'original-owner', loginId: 'name', displayName: 'Member', dabutUserId: 'central', isActive: true };

test('verified linking retires the legacy password and local sessions while retaining its owner', async (context) => {
  isolateSession(context);
  const update = context.mock.method(User, 'findOneAndUpdate', () => ({ lean: async () => linked }));
  const revoke = context.mock.method(AgentToken, 'updateMany', async () => ({ modifiedCount: 2 }));
  const result = await identityStore.link(linked.userId, linked.dabutUserId);
  assert.equal(result?.userId, linked.userId);
  const [, mutation] = update.mock.calls[0].arguments;
  assert.deepEqual(mutation, { $set: { dabutUserId: 'central', authProvider: 'dabut' }, $unset: { password: '' } });
  assert.equal(revoke.mock.callCount(), 1);
  assert.deepEqual(revoke.mock.calls[0].arguments, [{ userId: 'original-owner', label: { $ne: 'dabut-session' }, revoked: { $ne: true } }, { $set: { revoked: true } }]);
});

test('already-linked members retry unfinished local credential retirement without relinking their owner', async () => {
  const calls: string[] = [];
  const store = { ...identityStore, findLinked: async () => linked, link: async (userId: string, central: string) => { calls.push(`${userId}:${central}`); return linked; } };
  assert.equal((await linkDabutIdentity(store, identity, { token: 'ds1_fixture' })).userId, linked.userId);
  assert.deepEqual(calls, ['original-owner:central']);
});

test('a failed owner compare cannot retire another members sessions', async (context) => {
  isolateSession(context);
  context.mock.method(User, 'findOneAndUpdate', () => ({ lean: async () => null }));
  const revoke = context.mock.method(AgentToken, 'updateMany', async () => ({ modifiedCount: 1 }));
  assert.equal(await identityStore.link('other', 'central'), null);
  assert.equal(revoke.mock.callCount(), 0);
});

test('a concurrent mapping discovered after creation conflict also completes retirement', async () => {
  let lookups = 0;
  let retired = false;
  const store = {
    ...identityStore, findLinked: async () => ++lookups === 1 ? null : linked,
    findLogin: async () => null, create: async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); },
    link: async () => { retired = true; return linked; },
  };
  assert.equal((await linkDabutIdentity(store, identity, { token: 'ds1_fixture' })).userId, linked.userId);
  assert.equal(retired, true);
});
