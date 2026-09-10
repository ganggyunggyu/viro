import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { createSchedulerClient } from './scheduler-client';
const config = { brokerUrl: 'https://viro.example', serviceSecret: 's'.repeat(32), workerId: 'worker', browsersPath: '/tmp/browser', pollIntervalMs: 15000, kind: 'operation' as const, id: 'a'.repeat(24), dispatchId: 'b'.repeat(64), ownerScope: 'c'.repeat(64) };

test('scheduler client binds exact task and signs raw body, then requires lease for owner data', async () => {
  const calls: Array<{ path: string; body: Record<string, unknown> }> = [];
  const fetcher = (async (url, init) => {
    const path = new URL(String(url)).pathname;
    const headers = new Headers(init?.headers);
    const raw = String(init?.body);
    const signature = createHmac('sha256', config.serviceSecret).update(`${headers.get('x-viro-timestamp')}\nPOST\n${path}\n${raw}`).digest('hex');
    assert.equal(headers.get('x-viro-signature'), signature);
    assert.equal(headers.get('authorization'), null);
    assert.equal(init?.redirect, 'error');
    const body = JSON.parse(raw); calls.push({ path, body });
    return Response.json(path.endsWith('/authorize') ? { authorized: true, ownerScope: config.ownerScope } : path.endsWith('/claim') ? { claimed: { ownerScope: config.ownerScope, leaseId: 'lease', operation: { id: config.id, status: 'running' }, account: {}, cafe: {} } } : { ok: true, accounts: [], cafes: [] });
  }) as typeof fetch;
  const client = createSchedulerClient(config, fetcher);
  await assert.rejects(client.broker.context());
  await client.handshake();
  await assert.rejects(client.claimOperation('d'.repeat(24)));
  await client.claimOperation(config.id);
  await client.broker.context();
  assert.equal(calls.at(-1)?.body.leaseId, 'lease');
  assert.ok(calls.every(({ path, body }) => path.startsWith(`/api/agent/scheduler/tasks/operation/${config.id}/`) && body.dispatchId === config.dispatchId));
});

test('owner mismatch and invalid secret fail before browser execution', async () => {
  assert.throws(() => createSchedulerClient({ ...config, serviceSecret: '' }));
  const client = createSchedulerClient(config, (async () => Response.json({ authorized: true, ownerScope: 'd'.repeat(64) })) as typeof fetch);
  await assert.rejects(client.handshake());
});
