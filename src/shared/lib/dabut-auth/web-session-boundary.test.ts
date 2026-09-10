import assert from 'node:assert/strict';
import test from 'node:test';
import { getCurrentUserId } from '@/shared/config/user';
import { getCurrentUser } from '@/features/auth/actions';
import { addAccountAction } from '@/entities/account/api';
import { GET as getAccounts } from '@/app/api/accounts/route';
import { GET as getCafes } from '@/app/api/cafes/route';
import { Account, Cafe } from '@/shared/models';
import { AgentToken } from '@/shared/models/agent-token';
import { User } from '@/shared/models/user';
import { dabutClient } from '@/shared/lib/dabut-auth/transport';
import { getAllAccounts } from '@/shared/config/accounts';
import { isolateSession } from './testing/session-fixture';

for (const token of [undefined, 'invalid-legacy', 'ds1_revoked']) {
  test(`missing or invalid web session denies tenant lookup: ${token ?? 'no cookie'}`, async (context) => {
    isolateSession(context, token);
    context.mock.method(AgentToken, 'findOne', () => ({ lean: async () => null }));
    context.mock.method(dabutClient, 'verify', async () => { throw new Error('session revoked'); });
    const accounts = context.mock.method(Account, 'find', () => ({ sort: () => ({ select: () => ({ lean: async () => [] }) }) }));
    const cafes = context.mock.method(Cafe, 'find', () => ({ sort: () => ({ select: () => ({ lean: async () => [] }) }) }));
    assert.equal((await getAccounts()).status, 401);
    assert.equal((await getCafes()).status, 401);
    assert.equal(accounts.mock.callCount(), 0);
    assert.equal(cafes.mock.callCount(), 0);
    await assert.rejects(getCurrentUserId(), /로그인/);
    assert.equal(await getCurrentUser(), null);
  });
}

test('missing web session cannot create a default-tenant account', async (context) => {
  isolateSession(context);
  const read = context.mock.method(Account, 'findOne', () => ({ lean: async () => null }));
  const write = context.mock.method(Account, 'findOneAndUpdate', async () => ({}));
  await assert.rejects(addAccountAction({ accountId: 'fixture', password: 'fixture', nickname: 'fixture' }), /로그인/);
  assert.equal(read.mock.callCount(), 0);
  assert.equal(write.mock.callCount(), 0);
});

test('valid common session reads only the linked local tenant', async (context) => {
  isolateSession(context, 'ds1_valid');
  context.mock.method(dabutClient, 'verify', async () => ({ service: 'viro', user: { id: 'central', username: 'member', label: '회원', isActive: true }, role: 'member', expiresAt: '2099-01-01T00:00:00Z' }));
  context.mock.method(User, 'findOne', () => ({ lean: async () => ({ userId: 'linked-owner', isActive: true }) }));
  context.mock.method(AgentToken, 'findOne', () => ({ lean: async () => ({ _id: 'session', revoked: false }) }));
  context.mock.method(AgentToken, 'updateOne', async () => ({}));
  const read = context.mock.method(Account, 'find', (filter: unknown) => {
    assert.deepEqual(filter, { userId: 'linked-owner', isActive: true });
    return { sort: () => ({ select: () => ({ lean: async () => [] }) }) };
  });
  assert.equal((await getAccounts()).status, 200);
  assert.equal(read.mock.callCount(), 1);
});

test('explicit batch owner remains available without an interactive cookie', async (context) => {
  isolateSession(context);
  const read = context.mock.method(Account, 'find', (filter: unknown) => {
    assert.deepEqual(filter, { userId: 'batch-owner', isActive: true });
    return { sort: () => ({ lean: async () => [] }) };
  });
  assert.deepEqual(await getAllAccounts('batch-owner'), []);
  assert.equal(read.mock.callCount(), 1);
});
