import assert from 'node:assert/strict';
import test from 'node:test';
import { createSequenceController, resolveSequenceTurnResult } from './sequence-harness';
import { createFakeSequenceRedis, createTestClock } from './testing/queue-test-harness';

test('waitForSequenceTurn returns ready when the requested index is current', async () => {
  const { redis } = createFakeSequenceRedis();
  const clock = createTestClock(1000);
  const controller = createSequenceController({
    getRedisConnection: () => redis,
    log: () => undefined,
    now: clock.now,
    sleep: clock.sleep,
  });

  const result = await controller.waitForSequenceTurn('seq-a', 0);

  assert.equal(result, 'ready');
});

test('waitForSequenceTurn returns pending after the configured wait window', async () => {
  const { redis, store } = createFakeSequenceRedis();
  const clock = createTestClock(1000);
  store.set('comment_sequence:seq-b', '0');
  store.set('comment_sequence:seq-b:ts', '1000');

  const controller = createSequenceController({
    getRedisConnection: () => redis,
    log: () => undefined,
    now: clock.now,
    pollMs: 100,
    sleep: clock.sleep,
    stallMs: 10_000,
    waitLimitMs: 300,
  });

  const result = await controller.waitForSequenceTurn('seq-b', 1);

  assert.equal(result, 'pending');
  assert.equal(clock.now(), 1300);
});

test('waitForSequenceTurn forces stalled sequences forward', async () => {
  const { redis, store } = createFakeSequenceRedis();
  const clock = createTestClock(10_000);
  store.set('comment_sequence:seq-c', '0');
  store.set('comment_sequence:seq-c:ts', '1000');

  const controller = createSequenceController({
    getRedisConnection: () => redis,
    log: () => undefined,
    now: clock.now,
    sleep: clock.sleep,
    stallMs: 5_000,
  });

  const result = await controller.waitForSequenceTurn('seq-c', 2);

  assert.equal(result, 'ready');
  assert.equal(store.get('comment_sequence:seq-c'), '2');
});

test('a force-advanced earlier index is reported as skipped instead of done', async () => {
  const { redis, store } = createFakeSequenceRedis();
  const clock = createTestClock(10_000);
  store.set('comment_sequence:seq-recovery', '0');
  store.set('comment_sequence:seq-recovery:ts', '1000');

  const controller = createSequenceController({
    getRedisConnection: () => redis,
    log: () => undefined,
    now: clock.now,
    sleep: clock.sleep,
    stallMs: 5_000,
  });

  assert.equal(await controller.waitForSequenceTurn('seq-recovery', 2), 'ready');
  const lateTurn = await controller.waitForSequenceTurn('seq-recovery', 0);
  const result = resolveSequenceTurnResult(lateTurn);

  assert.equal(lateTurn, 'skipped');
  assert.equal(result?.success, true);
  assert.equal(result?.skipped, true);
  assert.equal(result?.outcome, 'skipped');
});

test('advanceSequence increments the sequence cursor and refreshes timestamp', async () => {
  const { redis, store } = createFakeSequenceRedis();
  const clock = createTestClock(50_000);
  store.set('comment_sequence:seq-d', '1');

  const controller = createSequenceController({
    getRedisConnection: () => redis,
    log: () => undefined,
    now: clock.now,
    sleep: clock.sleep,
  });

  await controller.advanceSequence('seq-d');

  assert.equal(store.get('comment_sequence:seq-d'), '2');
  assert.equal(store.get('comment_sequence:seq-d:ts'), '50000');
});
