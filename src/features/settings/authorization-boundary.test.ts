import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import axios from 'axios';
import { isolateSession } from '@/shared/lib/dabut-auth/testing/session-fixture';
import { User } from '@/shared/models/user';
import { AgentToken } from '@/shared/models/agent-token';
import { Account } from '@/shared/models/account';
import { QueueSettings, DEFAULT_QUEUE_SETTINGS } from '@/shared/models/queue-settings';
import { dabutClient } from '@/shared/lib/dabut-auth/transport';
import { updateAccountApiKeyAction, testAccountApiKeyAction } from './account-api-key-actions';
import { getSettingsAction, updateSettingsAction, resetSettingsAction } from './actions';
import { testAccountKey } from './account-api-key-test';

const login = (context: TestContext, revoked = false) => {
  isolateSession(context, 'ds1_fixture');
  context.mock.method(dabutClient, 'verify', async () => ({ service: 'viro', user: { id: 'central', username: 'admin', label: '', isActive: true }, role: 'admin', expiresAt: '2099-01-01T00:00:00Z' }));
  context.mock.method(User, 'findOne', () => ({ lean: async () => ({ userId: 'owner', isActive: true }) }));
  context.mock.method(AgentToken, 'findOne', () => ({ lean: async () => ({ _id: 'session', revoked }) }));
  context.mock.method(AgentToken, 'updateOne', async () => ({}));
};

test('foreign or inactive accounts cannot be mutated or charged for key tests', async (context) => {
  login(context);
  context.mock.method(Account, 'findOne', (filter: unknown) => {
    assert.deepEqual(filter, { userId: 'owner', accountId: 'foreign', isActive: true });
    return { select: () => ({ lean: async () => null }) };
  });
  const write = context.mock.method(Account, 'updateOne', async () => ({}));
  const provider = context.mock.method(axios, 'post', async () => ({}));
  await assert.rejects(updateAccountApiKeyAction('foreign', 'gemini', 'synthetic'), /찾을 수 없/);
  await assert.rejects(testAccountApiKeyAction('foreign', 'deepseek'), /찾을 수 없/);
  assert.equal(write.mock.callCount(), 0);
  assert.equal(provider.mock.callCount(), 0);
});

test('verified service admins retain queue configuration access but revoked sessions do not', async (context) => {
  login(context);
  context.mock.method(QueueSettings, 'findOne', () => ({ lean: async () => DEFAULT_QUEUE_SETTINGS }));
  const write = context.mock.method(QueueSettings, 'findOneAndUpdate', async () => DEFAULT_QUEUE_SETTINGS);
  assert.deepEqual(await getSettingsAction(), DEFAULT_QUEUE_SETTINGS);
  await updateSettingsAction({ timeout: 1000 });
  await resetSettingsAction();
  assert.equal(write.mock.callCount(), 2);
});

test('a revoked admin session fails before queue or account lookups', async (context) => {
  login(context, true);
  const read = context.mock.method(QueueSettings, 'findOne', () => ({ lean: async () => DEFAULT_QUEUE_SETTINGS }));
  const account = context.mock.method(Account, 'findOne', () => ({ select: () => ({ lean: async () => null }) }));
  await assert.rejects(getSettingsAction(), /로그인/);
  await assert.rejects(testAccountApiKeyAction('owned', 'deepseek'), /로그인/);
  assert.equal(read.mock.callCount(), 0);
  assert.equal(account.mock.callCount(), 0);
});

test('provider error details and completions cannot expose a stored key', async (context) => {
  const secret = 'synthetic-provider-private-key';
  const provider = context.mock.method(axios, 'post', async () => { throw new Error(`Invalid ${secret}`); });
  assert.equal(JSON.stringify(await testAccountKey('deepseek', secret)).includes(secret), false);
  provider.mock.mockImplementation(async () => ({ data: { choices: [{ message: { content: secret } }] } }));
  assert.equal(JSON.stringify(await testAccountKey('deepseek', secret)).includes(secret), false);
});

test('empty provider responses are reported as failed key verification', async (context) => {
  context.mock.method(axios, 'post', async () => ({ data: {} }));
  assert.equal((await testAccountKey('deepseek', 'synthetic-key')).success, false);
});
