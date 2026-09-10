import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import mongoose from 'mongoose';
import { authenticateAgentToken } from '@/shared/lib/agent-broker/auth';
import { dabutClient } from '@/shared/lib/dabut-auth/transport';
import { authError } from '@/shared/lib/dabut-auth/contracts';
import { POST } from '@/app/api/auth/dabut/route';
import { User } from '@/shared/models/user';
import { AgentToken } from '@/shared/models/agent-token';

const identity = { service: 'viro' as const, user: { id: 'central', username: 'name', label: '회원', isActive: true }, role: 'member' as const, expiresAt: '2099-01-01T00:00:00Z' };
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

test('agent and web token entry point uses the mapped owner and fails closed on central rejection', async (context) => {
  isolateDb(context);
  const verify = context.mock.method(dabutClient, 'verify', async () => identity);
  context.mock.method(User, 'findOne', () => ({ lean: async () => ({ userId: 'existing-owner', isActive: true }) }));
  const lookup = context.mock.method(AgentToken, 'findOne', () => ({ lean: async () => ({ _id: 'central-session', revoked: false }) }));
  context.mock.method(AgentToken, 'updateOne', async () => ({}));
  assert.deepEqual(await authenticateAgentToken('ds1_synthetic'), { userId: 'existing-owner', tokenId: 'central-session' });
  const lookups = lookup.mock.callCount();
  verify.mock.mockImplementation(async () => { throw authError(503, 'identity_unavailable', 'unavailable'); });
  assert.equal(await authenticateAgentToken('ds1_synthetic'), null);
  assert.equal(lookup.mock.callCount(), lookups);
});

test('HTTP connector returns the existing userId and never exposes stored account fields', async (context) => {
  isolateDb(context);
  context.mock.method(dabutClient, 'verify', async () => identity);
  context.mock.method(User, 'findOne', () => ({ lean: async () => ({ userId: 'existing-owner', loginId: 'name', displayName: '이름', dabutUserId: 'central', isActive: true, password: 'must-not-return' }) }));
  const metadata = context.mock.method(AgentToken, 'findOneAndUpdate', async () => ({}));
  const response = await POST(new Request('https://viro.example/api/auth/dabut', { method: 'POST', body: JSON.stringify({ token: 'ds1_synthetic' }) }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { token: 'ds1_synthetic', userId: 'existing-owner', dabutUserId: 'central', displayName: '이름' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const cookie = response.headers.get('set-cookie') || '';
  assert.match(cookie, /cafe-bot-user-id=ds1_synthetic/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=lax/i);
  assert.equal(metadata.mock.callCount(), 1);
});

test('HTTP connector reports named-account conflict and invalid input without mutation', async (context) => {
  isolateDb(context);
  context.mock.method(dabutClient, 'verify', async () => identity);
  context.mock.method(User, 'findOne', (filter: Record<string, unknown>) => ({ lean: async () => filter.dabutUserId ? null : { userId: 'legacy', isActive: true } }));
  const create = context.mock.method(User, 'create', () => { throw new Error('creation forbidden'); });
  const response = await POST(new Request('https://viro.example/api/auth/dabut', { method: 'POST', body: JSON.stringify({ token: 'ds1_synthetic' }) }));
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, 'account_link_required');
  const invalid = await POST(new Request('https://viro.example/api/auth/dabut', { method: 'POST', body: JSON.stringify({ token: 42 }) }));
  assert.equal(invalid.status, 400);
  assert.equal(create.mock.callCount(), 0);
});
