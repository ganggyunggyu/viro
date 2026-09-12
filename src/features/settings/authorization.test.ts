import assert from 'node:assert/strict';
import test from 'node:test';
import { isolateSession } from '@/shared/lib/dabut-auth/testing/session-fixture';
import { Account } from '@/shared/models/account';
import { User } from '@/shared/models/user';
import { AgentToken } from '@/shared/models/agent-token';
import { QueueSettings } from '@/shared/models/queue-settings';
import { dabutClient } from '@/shared/lib/dabut-auth/transport';
import { getSettingsAction, updateSettingsAction, resetSettingsAction } from './actions';
import { getAccountApiKeyStatusAction, updateAccountApiKeyAction, clearAccountApiKeyAction } from './account-api-key-actions';

test('unauthenticated account key actions reject before database access', async (context) => {
  isolateSession(context);
  const read = context.mock.method(Account, 'findOne', () => ({ select: () => ({ lean: async () => null }) }));
  const write = context.mock.method(Account, 'updateOne', async () => ({ matchedCount: 1 }));
  for (const run of [() => getAccountApiKeyStatusAction('victim'), () => updateAccountApiKeyAction('victim', 'gemini', 'synthetic'), () => clearAccountApiKeyAction('victim', 'gemini')]) {
    await assert.rejects(run, /로그인/);
  }
  assert.equal(read.mock.callCount(), 0);
  assert.equal(write.mock.callCount(), 0);
});

test('owned key writes require an active account in the current tenant and do not expose keys', async (context) => {
  isolateSession(context, 'ds1_fixture');
  context.mock.method(dabutClient, 'verify', async () => ({ service: 'viro', user: { id: 'central', username: 'member', label: '', isActive: true }, role: 'member', expiresAt: '2099-01-01T00:00:00Z' }));
  context.mock.method(User, 'findOne', () => ({ lean: async () => ({ userId: 'owner', isActive: true }) }));
  context.mock.method(AgentToken, 'findOne', () => ({ lean: async () => ({ _id: 'session' }) }));
  context.mock.method(AgentToken, 'updateOne', async () => ({}));
  const reads = context.mock.method(Account, 'findOne', (filter: unknown) => {
    assert.deepEqual(filter, { userId: 'owner', accountId: 'owned', isActive: true });
    return { select: () => ({ lean: async () => ({ apiKeys: { gemini: 'synthetic-private-key' } }) }) };
  });
  const writes = context.mock.method(Account, 'updateOne', (filter: unknown) => {
    assert.deepEqual(filter, { userId: 'owner', accountId: 'owned', isActive: true });
    return Promise.resolve({ matchedCount: 1 });
  });
  const result = await updateAccountApiKeyAction('owned', 'gemini', 'synthetic-private-key');
  assert.equal(JSON.stringify(result).includes('synthetic-private-key'), false);
  assert.ok(reads.mock.callCount() > 0);
  assert.equal(writes.mock.callCount(), 1);
});

for (const token of [undefined, 'ds1_member']) {
  test(`global queue settings require a verified service admin: ${token ?? 'no session'}`, async (context) => {
    isolateSession(context, token);
    context.mock.method(dabutClient, 'verify', async () => ({ service: 'viro', user: { id: 'central', username: 'member', label: '', isActive: true }, role: 'member', expiresAt: '2099-01-01T00:00:00Z' }));
    context.mock.method(User, 'findOne', () => ({ lean: async () => ({ userId: 'owner', isActive: true }) }));
    context.mock.method(AgentToken, 'findOne', () => ({ lean: async () => ({ _id: 'session' }) }));
    context.mock.method(AgentToken, 'updateOne', async () => ({}));
    const read = context.mock.method(QueueSettings, 'findOne', () => ({ lean: async () => ({ delays: {}, retry: {}, limits: {}, timeout: 1 }) }));
    const write = context.mock.method(QueueSettings, 'findOneAndUpdate', async () => ({ delays: {}, retry: {}, limits: {}, timeout: 1 }));
    for (const run of [getSettingsAction, () => updateSettingsAction({ timeout: 2 }), resetSettingsAction]) await assert.rejects(run, /로그인|관리자/);
    assert.equal(read.mock.callCount(), 0);
    assert.equal(write.mock.callCount(), 0);
  });
}
