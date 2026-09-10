import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSchedulerDispatch, createSchedulerOutbox, type SchedulerOutboxDocument, type SchedulerTask } from '@/shared/lib/agent-scheduler/outbox';

const row = (patch: Partial<SchedulerOutboxDocument> = {}): SchedulerOutboxDocument => ({
  _id: 'a'.repeat(24), userId: 'owner', status: 'pending', createdAt: new Date(),
  ...createSchedulerDispatch(), ...patch,
});
const fixture = () => {
  const calls: { attempts: SchedulerTask[]; delivered: SchedulerTask[]; bodies: string[]; limits: number[]; expired: number } = {
    attempts: [], delivered: [], bodies: [], limits: [], expired: 0,
  };
  let status = 202;
  const deps = {
    url: 'https://scheduler.example', secret: 's'.repeat(32),
    signRequest: (secret: string, method: string, pathname: string, body: string) => {
      assert.equal(secret, 's'.repeat(32)); assert.equal(method, 'POST'); assert.equal(pathname, '/viro/tasks');
      calls.bodies.push(body);
      return { 'x-viro-timestamp': '123', 'x-viro-signature': 'signature' };
    },
    fetch: (async (url: string | URL | Request, options?: RequestInit) => {
      assert.equal(String(url), 'https://scheduler.example/viro/tasks');
      assert.equal(options?.method, 'POST'); assert.equal(options.redirect, 'error');
      assert.ok(options.signal); assert.equal(options.body, calls.bodies.at(-1));
      assert.equal(new Headers(options.headers).get('x-viro-signature'), 'signature');
      return new Response(null, { status });
    }) as typeof fetch,
    beginAttempt: async (task: SchedulerTask) => { calls.attempts.push(task); return true; },
    markDelivered: async (task: SchedulerTask, date: Date) => { assert.ok(date instanceof Date); calls.delivered.push(task); return true; },
    findPending: async (limit: number) => { calls.limits.push(limit); return [{ kind: 'operation' as const, doc: row() }]; },
    expireStale: async () => { calls.expired += 1; },
  };
  return { deps, calls, setStatus: (value: number) => { status = value; } };
};

test('new dispatch identity is a unique 256-bit lowercase hex value', () => {
  const first = createSchedulerDispatch();
  assert.deepEqual({ ...first, dispatchId: '' }, { executionTarget: 'scheduler', dispatchId: '', dispatchState: 'pending', dispatchAttempts: 0 });
  assert.match(first.dispatchId, /^[a-f0-9]{64}$/);
  assert.notEqual(first.dispatchId, createSchedulerDispatch().dispatchId);
});

test('dispatch signs the exact minimal body and acknowledges only HTTP 202', async () => {
  const { deps, calls, setStatus } = fixture();
  const outbox = createSchedulerOutbox(deps);
  const doc = row();
  assert.equal(await outbox.dispatch('operation', doc), true);
  assert.deepEqual(JSON.parse(calls.bodies[0]), { kind: 'operation', id: String(doc._id), dispatchId: doc.dispatchId });
  for (const status of [200, 201, 204, 301, 401, 409, 500, 503]) {
    setStatus(status);
    assert.equal(await outbox.dispatch('operation', doc), false);
  }
  assert.equal(calls.attempts.length, 9);
  assert.equal(calls.delivered.length, 1);
});

test('invalid or missing config cannot send requests or mutate delivery state', async () => {
  for (const url of [undefined, '', 'http://example.com', 'file:///tmp/service', 'https://user:pass@example.com', 'https://example.com/?token=value', 'https://example.com/#fragment', 'https://example.com/base']) {
    const { deps, calls } = fixture();
    assert.equal(await createSchedulerOutbox({ ...deps, url }).dispatch('operation', row()), false);
    assert.equal(calls.attempts.length, 0);
  }
  for (const secret of [undefined, '', 'x'.repeat(31)]) {
    const { deps, calls } = fixture();
    assert.equal(await createSchedulerOutbox({ ...deps, secret }).dispatch('operation', row()), false);
    assert.equal(calls.attempts.length, 0);
  }
});

test('legacy, malformed, delivered, and non-pending documents never dispatch', async () => {
  const { deps, calls } = fixture();
  for (const patch of [
    { executionTarget: undefined }, { dispatchId: undefined }, { dispatchId: 'invalid' },
    { dispatchState: 'delivered' as const }, { dispatchState: undefined },
    ...['running', 'done', 'failed', 'needs_review'].map((status) => ({ status })),
  ]) assert.equal(await createSchedulerOutbox(deps).dispatch('operation', row(patch)), false);
  assert.equal(calls.attempts.length, 0);
  assert.equal(calls.bodies.length, 0);
});

test('failed delivery and acknowledgement never reject an already accepted request', async () => {
  for (const phase of ['beginAttempt', 'fetch', 'markDelivered'] as const) {
    const { deps } = fixture();
    const fail = async () => { throw new Error('upstream private failure'); };
    assert.equal(await createSchedulerOutbox({ ...deps, [phase]: fail }).dispatch('operation', row()), false);
  }
  const { deps, calls } = fixture();
  assert.equal(await createSchedulerOutbox({ ...deps, beginAttempt: async () => false }).dispatch('operation', row()), false);
  assert.equal(calls.bodies.length, 0);
});

test('recovery is bounded, expires stale leases, and checks eligibility again', async () => {
  const { deps, calls } = fixture();
  const pending = row();
  const legacy = row({ executionTarget: undefined });
  const outbox = createSchedulerOutbox({ ...deps, findPending: async (limit) => {
    calls.limits.push(limit);
    return [{ kind: 'operation', doc: legacy }, { kind: 'operation', doc: pending }, { kind: 'action', doc: row({ _id: 'b'.repeat(64) }) }];
  } });
  assert.deepEqual(await outbox.recover(2), { examined: 2, delivered: 1 });
  assert.deepEqual(calls.limits, [2]); assert.equal(calls.expired, 1);
  assert.equal(calls.delivered.length, 1);
  assert.deepEqual(await createSchedulerOutbox(deps).recover(), { examined: 1, delivered: 1 });
  assert.deepEqual(calls.limits, [2, 50]);
  for (const limit of [0, 101, 1.5, NaN]) await assert.rejects(outbox.recover(limit), RangeError);
});

test('duplicate dispatches preserve the same task and dispatch identity', async () => {
  const { deps, calls } = fixture();
  const doc = row();
  const outbox = createSchedulerOutbox(deps);
  await Promise.all([outbox.dispatch('operation', doc), outbox.dispatch('operation', doc)]);
  assert.equal(new Set(calls.bodies).size, 1);
  assert.equal(calls.attempts.length, 2);
});

test('bounded recovery dispatches start together so one offline timeout cannot block every following row', async () => {
  const { deps } = fixture();
  const releases: (() => void)[] = [];
  const fetch = (async () => {
    await new Promise<void>((resolve) => { releases.push(resolve); });
    return new Response(null, { status: 202 });
  }) as typeof globalThis.fetch;
  const outbox = createSchedulerOutbox({ ...deps, fetch, findPending: async () => [
    { kind: 'operation', doc: row() }, { kind: 'action', doc: row({ _id: 'b'.repeat(64) }) },
  ] });
  const recovered = outbox.recover(2);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(releases.length, 2);
  for (const release of releases) release();
  assert.deepEqual(await recovered, { examined: 2, delivered: 2 });
});

test('HTTPS and explicit loopback HTTP destinations accept a 32-byte unicode secret', async () => {
  for (const url of ['https://scheduler.example', 'http://localhost:3007', 'http://127.0.0.1:3007', 'http://[::1]:3007']) {
    const { deps } = fixture();
    const secret = '한'.repeat(11);
    const outbox = createSchedulerOutbox({ ...deps, url, secret, signRequest: (actualSecret) => {
      assert.equal(actualSecret, secret); return {};
    }, fetch: (async (target) => {
      assert.equal(String(target), `${url}/viro/tasks`); return new Response(null, { status: 202 });
    }) as typeof fetch });
    assert.equal(await outbox.dispatch('operation', row()), true);
  }
});
