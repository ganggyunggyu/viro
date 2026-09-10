import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmbeddedClient } from './client';
const config = { brokerUrl: 'https://viro.example', token: 'private-fixture', workerId: 'ply-fixture', browsersPath: '/tmp/browsers', pollIntervalMs: 15000 };

test('uses only dedicated exact-ID claims, secure headers, no redirects and broker captcha', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const client = createEmbeddedClient(config, (async (url, init) => {
    const path = new URL(String(url)).pathname;
    calls.push({ path, init });
    return Response.json(path.endsWith('/embedded') ? { protocol: 'viro-embedded-worker/1', claimById: true } : { claimed: null, task: null, answer: ' CAPTCHA ', ok: true });
  }) as typeof fetch);
  await client.handshake();
  await client.claimOperation('a'.repeat(24));
  await client.claimAction('b'.repeat(64));
  assert.equal(await client.solveCaptcha({ image: 'fixture', kind: 'login' }), 'CAPTCHA');
  assert.deepEqual(calls.map(({ path }) => path), ['/api/agent/embedded', `/api/agent/operations/${'a'.repeat(24)}/claim`, `/api/agent/actions/${'b'.repeat(64)}/claim`, '/api/agent/captcha']);
  for (const { init } of calls) {
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer private-fixture');
    assert.equal(init?.redirect, 'error');
    assert.ok(init?.signal);
  }
  await assert.rejects(client.broker.claim());
});

test('old server, authentication and upstream errors use safe codes without reflecting response bodies', async () => {
  for (const [status, code] of [[404, 'server_update_required'], [401, 'authentication_required'], [403, 'authentication_required'], [500, 'broker_unavailable']] as const) {
    const client = createEmbeddedClient(config, (async () => new Response('private-fixture password', { status })) as typeof fetch);
    await assert.rejects(client.handshake(), (error: Error & { code?: string }) => error.code === code && !error.message.includes('private-fixture'));
  }
  const unsupported = createEmbeddedClient(config, (async () => Response.json({ protocol: 'old', claimById: true })) as typeof fetch);
  await assert.rejects(unsupported.handshake(), (error: Error & { code?: string }) => error.code === 'server_update_required');
});

test('invalid broker origins and invalid IDs cannot send credentials', async () => {
  let calls = 0;
  const fetcher = (async () => { calls += 1; return Response.json({}); }) as typeof fetch;
  for (const brokerUrl of ['http://remote.example', 'https://name:pass@viro.example', 'https://viro.example/path', 'https://viro.example?secret']) {
    assert.throws(() => createEmbeddedClient({ ...config, brokerUrl }, fetcher));
  }
  const client = createEmbeddedClient(config, fetcher);
  await assert.rejects(client.claimOperation('../claim'));
  await assert.rejects(client.claimAction('a'.repeat(24)));
  assert.equal(calls, 0);
});
