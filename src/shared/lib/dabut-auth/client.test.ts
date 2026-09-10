import assert from 'node:assert/strict';
import test from 'node:test';
import { createDabutClient, type IdentityRequest } from '@/shared/lib/dabut-auth/client';

const valid = { service: 'viro', user: { id: 'abc', username: 'name', label: '회원', isActive: true }, role: 'member', expiresAt: '2099-01-01T00:00:00Z' };

test('service token validation uses the central viro session identity', async () => {
  const calls: unknown[][] = [];
  const request: IdentityRequest = async (...args) => { calls.push(args); return valid; };
  assert.deepEqual(await createDabutClient(request).verify('ds1_synthetic'), valid);
  assert.deepEqual(calls, [['GET', '/auth/app/service-sessions/me', 'ds1_synthetic']]);
});

test('wrong target, inactive member, missing role and expired sessions fail closed', async () => {
  for (const result of [{ ...valid, service: 'exposure' }, { ...valid, role: undefined },
    { ...valid, expiresAt: '2000-01-01T00:00:00Z' }, { ...valid, user: { ...valid.user, isActive: false } }]) {
    await assert.rejects(createDabutClient(async () => result).verify('ds1_synthetic'), { status: 401 });
  }
});

test('legacy tokens never reach central verification and outages never authenticate', async () => {
  let calls = 0;
  const client = createDabutClient(async () => { calls++; throw new Error('upstream details'); });
  await assert.rejects(client.verify('legacy'), { status: 401 });
  assert.equal(calls, 0);
  await assert.rejects(client.verify('ds1_synthetic'), { status: 503, code: 'identity_unavailable' });
});

test('common login exchanges the access token for a viro session and signup uses central identity', async () => {
  const calls: unknown[][] = [];
  const client = createDabutClient(async (...args) => {
    calls.push(args);
    return args[1] === '/auth/app/service-sessions' ? { ...valid, token: 'ds1_synthetic' } : { access_token: 'access-token' };
  });
  assert.equal((await client.login('name', 'synthetic-password')).token, 'ds1_synthetic');
  assert.deepEqual(calls[1], ['POST', '/auth/app/service-sessions', 'access-token', { service: 'viro' }]);
  await client.login('name', 'synthetic-password', '표시 이름');
  assert.equal(calls[2][1], '/auth/app/signup');
  await client.revoke('ds1_synthetic');
  assert.deepEqual(calls[4], ['DELETE', '/auth/app/service-sessions/current', 'ds1_synthetic']);
});
