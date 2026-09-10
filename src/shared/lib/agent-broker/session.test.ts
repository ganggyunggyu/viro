import assert from 'node:assert/strict';
import test from 'node:test';
import { hashAgentToken, resolveAgentSession, type StoredSession } from './session';

test('사용자 ID 자체와 만료·폐기·비활성 세션은 인증되지 않는다', async () => {
  let session: StoredSession = { userId: 'user-1', tokenId: 'session-1' };
  let active = true; let touched = 0;
  const store = {
    find: async (hash: string) => hash === hashAgentToken('synthetic-session') ? session : null,
    activeUser: async () => active, touch: async () => { touched += 1; },
  };
  assert.equal(await resolveAgentSession(store, 'user-1'), null);
  assert.deepEqual(await resolveAgentSession(store, 'synthetic-session'), { userId: 'user-1', tokenId: 'session-1' });
  session = { ...session, expiresAt: new Date(1000) };
  assert.equal(await resolveAgentSession(store, 'synthetic-session', 1000), null);
  session = { ...session, expiresAt: undefined, revoked: true };
  assert.equal(await resolveAgentSession(store, 'synthetic-session'), null);
  session = { ...session, revoked: false }; active = false;
  assert.equal(await resolveAgentSession(store, 'synthetic-session'), null);
  assert.equal(touched, 1);
});
