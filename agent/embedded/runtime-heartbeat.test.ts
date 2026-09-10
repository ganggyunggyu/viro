import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkerRuntime, type WorkerDriver } from './runtime';
import { EmbeddedWorkerError } from './errors';

test('periodic heartbeats never poll a queue and only renew an ID after claim confirmation', async () => {
  let pulse: () => Promise<void> = async () => {};
  let stopped = false;
  let confirmClaim: () => void = () => {};
  let finish: () => void = () => {};
  let lease: () => boolean = () => false;
  let failHeartbeat = false;
  let writes = 0;
  const heartbeats: Array<[string | undefined, string | undefined]> = [];
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  const driver: WorkerDriver = {
    handshake: async () => {}, prepareBrowser: async () => {},
    heartbeat: async (operationId, taskId) => {
      heartbeats.push([operationId, taskId]);
      if (failHeartbeat) throw new EmbeddedWorkerError('authentication_required');
    },
    run: async (kind, id, ownsLease, onClaimed) => {
      lease = ownsLease;
      confirmClaim = onClaimed;
      writes += 1;
      await pending;
      return { kind, id, claimed: true, reported: false };
    },
    closeBrowser: async () => { finish(); },
  };
  const worker = createWorkerRuntime({ brokerUrl: 'https://viro.example', token: 'fixture', workerId: 'fixture', browsersPath: '/tmp/fixture', pollIntervalMs: 15000 }, {}, driver, (tick, interval) => {
    assert.equal(interval, 15000); pulse = tick; return () => { stopped = true; };
  });
  await worker.prepare();
  await pulse();
  assert.equal(writes, 0);
  const running = worker.execute('operation', 'a'.repeat(24));
  await Promise.resolve();
  await pulse();
  assert.deepEqual(heartbeats.at(-1), [undefined, undefined]);
  confirmClaim();
  await pulse();
  assert.deepEqual(heartbeats.at(-1), ['a'.repeat(24), undefined]);
  assert.equal(lease(), true);
  failHeartbeat = true;
  await pulse();
  assert.equal(lease(), false);
  assert.equal(stopped, true);
  assert.equal(heartbeats.length, 5);
  await running;
  await assert.rejects(worker.execute('operation', 'b'.repeat(24)));
  await worker.close();
});

test('prepare exposes only whitelisted cause codes for server, auth, browser and heartbeat failures', async () => {
  for (const [stage, failure, expected] of [
    ['handshake', new EmbeddedWorkerError('server_update_required'), 'server_update_required'],
    ['handshake', new EmbeddedWorkerError('authentication_required'), 'authentication_required'],
    ['prepareBrowser', new Error('raw password'), 'browser_prepare_failed'],
    ['heartbeat', new Error('raw token'), 'broker_unavailable'],
  ] as const) {
    const driver: WorkerDriver = { handshake: async () => {}, prepareBrowser: async () => {}, heartbeat: async () => {}, run: async () => { throw new Error(); }, closeBrowser: async () => {} };
    driver[stage] = async () => { throw failure; };
    const worker = createWorkerRuntime({ brokerUrl: 'https://viro.example', token: 'fixture', workerId: 'fixture', browsersPath: '/tmp/fixture', pollIntervalMs: 15000 }, {}, driver);
    await assert.rejects(worker.prepare(), (error: Error & { code?: string }) => error.code === expected && !error.message.includes('raw'));
    await worker.close();
  }
});
