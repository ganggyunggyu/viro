import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkerRuntime, type WorkerDriver } from './runtime';
import type { EmbeddedWorkerConfig } from './types';

const config: EmbeddedWorkerConfig = { brokerUrl: 'https://viro.example', token: 'fixture-token', workerId: 'embedded-fixture', browsersPath: '/tmp/fixture-browsers', pollIntervalMs: 10 };
const id = 'a'.repeat(24);
const setup = (overrides: Partial<WorkerDriver> = {}) => {
  const calls: string[] = [];
  const driver: WorkerDriver = {
    handshake: async () => { calls.push('handshake'); },
    prepareBrowser: async () => { calls.push('browser'); },
    heartbeat: async (operationId, taskId) => { calls.push(`heartbeat:${operationId || taskId || ''}`); },
    run: async (kind, taskId, ownsLease) => {
      assert.equal(ownsLease(), true);
      calls.push(`run:${taskId}`);
      return { kind, id: taskId, claimed: true, reported: true };
    },
    closeBrowser: async () => { calls.push('close'); },
    ...overrides,
  };
  return { calls, worker: createWorkerRuntime(config, {}, driver) };
};

test('prepare verifies protocol and browser before advertising readiness, without executing queued work', async () => {
  const { worker, calls } = setup();
  try {
    const [first, second] = await Promise.all([worker.prepare(), worker.prepare()]);
    assert.deepEqual(first, second);
    assert.equal(first.ready, true);
    assert.deepEqual(calls, ['handshake', 'browser', 'heartbeat:']);
  } finally { await worker.close(); }
});

test('unsupported server cannot launch browser or advertise readiness', async () => {
  const { worker, calls } = setup({ handshake: async () => { throw new Error('server-secret'); } });
  await assert.rejects(worker.prepare(), (error: Error) => !error.message.includes('server-secret'));
  assert.equal(calls.some((call) => call.startsWith('heartbeat') || call === 'browser'), false);
  await worker.close();
});

test('execute requires prepare, validates exact IDs and never repeats an execution in the same worker', async () => {
  const { worker, calls } = setup();
  await assert.rejects(worker.execute('operation', id));
  await worker.prepare();
  await assert.rejects(worker.execute('operation', '../claim'));
  const first = await worker.execute('operation', id);
  const second = await worker.execute('operation', id);
  assert.deepEqual(second, first);
  assert.equal(calls.filter((call) => call.startsWith('run:')).length, 1);
  await worker.close();
  await assert.rejects(worker.execute('operation', id));
  await assert.rejects(worker.prepare());
});

test('report failure cannot run a second external write', async () => {
  let executed = 0;
  const { worker } = setup({ run: async () => { executed += 1; throw new Error('secret password'); } });
  await worker.prepare();
  await assert.rejects(worker.execute('operation', id), (error: Error) => !error.message.includes('secret'));
  await assert.rejects(worker.execute('operation', id));
  assert.equal(executed, 1);
  await worker.close();
});

test('close interrupts the browser, waits for active work and releases resources once', async () => {
  let finish: () => void = () => {};
  const running = new Promise<void>((resolve) => { finish = resolve; });
  const { worker, calls } = setup({
    run: async (kind, taskId) => { await running; return { kind, id: taskId, claimed: true, reported: false }; },
    closeBrowser: async () => { calls.push('closed'); finish(); },
  });
  await worker.prepare();
  const task = worker.execute('operation', id);
  await Promise.resolve();
  await assert.rejects(worker.execute('action', 'b'.repeat(64)));
  await Promise.all([worker.close(), worker.close(), task]);
  assert.equal(calls.filter((call) => call === 'closed').length, 1);
});
