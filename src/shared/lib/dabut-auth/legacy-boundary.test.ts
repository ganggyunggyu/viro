import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import mongoose from 'mongoose';
import { authenticateAgentToken } from '@/shared/lib/agent-broker/auth';
import { POST } from '@/app/api/agent/login/route';
import { User } from '@/shared/models/user';
import { AgentToken } from '@/shared/models/agent-token';
import { authenticateLogin } from '@/shared/lib/agent-management/login-service';
import { createRequire } from 'node:module';
import { issueAgentToken } from '@/features/agent-setup/actions';
import { dabutClient } from '@/shared/lib/dabut-auth/transport';

const isolateDb = (context: TestContext) => {
  const cache = global.mongooseCache!;
  const previous = { ...cache };
  const descriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
  cache.conn = mongoose;
  context.after(() => {
    Object.assign(cache, previous);
    if (descriptor) Object.defineProperty(mongoose.connection, 'readyState', descriptor);
    else Reflect.deleteProperty(mongoose.connection, 'readyState');
  });
  context.mock.method(mongoose, 'connect', () => { throw new Error('real DB forbidden'); });
  context.mock.method(mongoose.Query.prototype, 'exec', () => { throw new Error('unmocked DB forbidden'); });
};
const account = { userId: 'old-owner', loginId: 'old-login', displayName: '기존 회원', password: 'fixture-password', dabutUserId: 'central' };

test('linked account cannot mint a new desktop token with the legacy password', async (context) => {
  isolateDb(context);
  context.mock.method(User, 'findOne', () => ({ lean: async () => account }));
  context.mock.method(User, 'updateOne', async () => ({}));
  const create = context.mock.method(AgentToken, 'create', async () => ({}));
  const response = await POST(new Request('https://viro.example/api/agent/login', {
    method: 'POST', body: JSON.stringify({ loginId: account.loginId, password: account.password }),
  }));
  assert.equal(response.status, 401);
  assert.equal(create.mock.callCount(), 0);
});

test('web credential verification rejects linked accounts before password migration', async () => {
  let updated = false;
  const result = await authenticateLogin({ findActive: async () => account, updatePassword: async () => { updated = true; } }, account.loginId, account.password);
  assert.equal(result, null);
  assert.equal(updated, false);
});

test('old pairing and web tokens cannot bypass central revocation after account linking', async (context) => {
  isolateDb(context);
  context.mock.method(AgentToken, 'findOne', () => ({ lean: async () => ({ _id: 'legacy-session', userId: account.userId, revoked: false }) }));
  context.mock.method(User, 'exists', (query: Record<string, unknown>) => {
    const filter = query.dabutUserId as { $exists?: boolean } | undefined;
    return filter?.$exists === false ? null : { _id: 'linked-user' };
  });
  const touch = context.mock.method(AgentToken, 'updateOne', async () => ({}));
  assert.equal(await authenticateAgentToken('legacy-pairing-token'), null);
  assert.equal(touch.mock.callCount(), 0);
});

test('a valid common session cannot mint an independent long-lived agent token', async (context) => {
  isolateDb(context);
  const headers = createRequire(import.meta.url)('next/headers');
  context.mock.method(headers, 'cookies', async () => ({ get: () => ({ value: 'ds1_fixture' }) }));
  context.mock.method(dabutClient, 'verify', async () => ({ service: 'viro', user: { id: 'central', username: 'name', label: '회원', isActive: true }, role: 'member', expiresAt: '2099-01-01T00:00:00Z' }));
  context.mock.method(User, 'findOne', () => ({ lean: async () => ({ ...account, isActive: true }) }));
  context.mock.method(User, 'exists', async () => null);
  context.mock.method(AgentToken, 'findOne', () => ({ lean: async () => ({ _id: 'session', revoked: false }) }));
  context.mock.method(AgentToken, 'updateOne', async () => ({}));
  const create = context.mock.method(AgentToken, 'create', async () => ({}));
  assert.equal((await issueAgentToken('new pairing')).success, false);
  assert.equal(create.mock.callCount(), 0);
});
