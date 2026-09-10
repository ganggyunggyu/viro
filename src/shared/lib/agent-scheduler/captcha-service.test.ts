import assert from 'node:assert/strict';
import test from 'node:test';
import { runSchedulerTask, type SchedulerTaskDependencies } from './task-service';
import { LEASE_MS, leaseKey, ownerScope, type SchedulerTask, type SchedulerVerb, type TaskReference } from './task-contract';
import type { TaskCaptchaPayload } from './captcha-contract';

const lease = { workerId: 'worker-1', leaseId: '12345678-1234-4123-8123-123456789012' };
const image = Buffer.from('synthetic-image').toString('base64');
const ref: TaskReference = { kind: 'operation', id: 'a'.repeat(24), dispatchId: 'd'.repeat(64) };
const fixture = (initial: Partial<SchedulerTask> = {}) => {
  let now = new Date('2026-09-08T00:00:00Z');
  const row: SchedulerTask = { ...ref, userId: 'database-owner', status: 'running', claimedBy: leaseKey(lease.workerId, lease.leaseId), claimedAt: now, operation: { type: 'write_comment', accountId: 'owned', cafeId: '123', articleId: 1, content: 'body' }, ...initial };
  const calls: Array<{ task: SchedulerTask; workerId: string; leaseId: string; payload: TaskCaptchaPayload }> = [];
  let afterForward = () => {};
  const matches = (target: TaskReference) => row.id === target.id && row.kind === target.kind && row.dispatchId === target.dispatchId;
  const dependencies = {
    now: () => now,
    store: {
      find: async (target: TaskReference) => matches(target) ? { ...row } : null,
      expire: async (target: TaskReference, cutoff: Date) => { if (matches(target) && row.status === 'running' && Number(row.claimedAt) < Number(cutoff)) row.status = 'needs_review'; },
      claim: async () => null, renew: async () => false, finish: async () => false,
    },
    context: async () => { throw new Error('credentials must not load'); },
    sync: async () => { throw new Error('sync must not run'); },
    prepare: async () => { throw new Error('prepare must not run'); },
    captcha: async (task: SchedulerTask, workerId: string, leaseId: string, payload: TaskCaptchaPayload) => {
      calls.push({ task, workerId, leaseId, payload });
      afterForward();
      return { answer: '1234', kind: payload.kind };
    },
  } satisfies SchedulerTaskDependencies & { captcha: unknown };
  const run = (verb: string, body: Record<string, unknown> = {}, target: TaskReference = row) => runSchedulerTask(dependencies, target, verb as SchedulerVerb, { dispatchId: target.dispatchId, ...lease, ...body });
  return { row, calls, run, afterForward: (callback: () => void) => { afterForward = callback; }, advance: () => { now = new Date(Number(now) + LEASE_MS + 1); } };
};

test('captcha authorization derives owner scope from an active stored task without forwarding', async () => {
  const f = fixture();
  assert.deepEqual(await f.run('captcha-authorize', { captchaKind: 'login' }), { authorized: true, ownerScope: ownerScope('database-owner') });
  assert.equal(f.calls.length, 0);
  for (const injected of [{ ownerScope: 'attacker' }, { userId: 'attacker' }, { payload: {} }]) {
    await assert.rejects(f.run('captcha-authorize', { captchaKind: 'login', ...injected }), { status: 400 });
  }
});

test('captcha forwards only an exact active lease and all three permitted task kinds', async () => {
  const examples: Array<[Partial<SchedulerTask>, TaskCaptchaPayload]> = [
    [{}, { image, kind: 'login', question: '  enter digits  ' }],
    [{ operation: { type: 'join_cafe', accountId: 'owned', cafeId: '123' } }, { image, kind: 'cafe-join' }],
    [{ kind: 'action', id: 'b'.repeat(64), operation: undefined, action: { type: 'cafe-create', input: { ownerAccountId: 'owned', name: 'Name', slug: 'safe-cafe', presetKey: 'standard', description: 'Description', keywords: ['test'] } } }, { image, kind: 'cafe-create' }],
  ];
  for (const [initial, payload] of examples) {
    const f = fixture(initial);
    assert.deepEqual(await f.run('captcha', { payload }), { answer: '1234', kind: payload.kind });
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].task.userId, 'database-owner');
    assert.equal(f.calls[0].workerId, lease.workerId);
    assert.equal(f.calls[0].leaseId, lease.leaseId);
    assert.deepEqual(f.calls[0].payload, { ...payload, ...(payload.question ? { question: payload.question.trim() } : {}) });
    assert.equal(f.row.status, 'running');
  }
});

test('unclaimed, foreign, expired and terminal tasks never authorize or forward a captcha', async () => {
  for (const verb of ['captcha', 'captcha-authorize']) {
    const body = verb === 'captcha' ? { payload: { image, kind: 'login', question: 'digits' } } : { captchaKind: 'login' };
    for (const initial of [{ status: 'pending' }, { status: 'done' }, { claimedBy: 'other-worker' }, { claimedAt: new Date('2020-01-01') }] as Partial<SchedulerTask>[]) {
      const f = fixture(initial);
      await assert.rejects(f.run(verb, body), { code: 'lease_lost', status: 409 });
      assert.equal(f.calls.length, 0);
    }
    const f = fixture();
    for (const target of [{ ...ref, id: 'e'.repeat(24) }, { ...ref, dispatchId: 'e'.repeat(64) }, { ...ref, kind: 'action' as const, id: 'a'.repeat(64) }]) {
      await assert.rejects(f.run(verb, body, target), { code: 'task_not_found', status: 404 });
    }
    await assert.rejects(f.run(verb, { ...body, workerId: 'other-worker' }), { code: 'lease_lost' });
    assert.equal(f.calls.length, 0);
  }
});

test('invalid captcha payload, owner injection and task kind mismatch fail before forward', async () => {
  const f = fixture();
  for (const body of [
    { payload: { image, kind: 'login' } },
    { payload: { image: Buffer.alloc(1_048_577).toString('base64'), kind: 'login', question: 'digits' } },
    { payload: { image, kind: 'login', question: 'digits', userId: 'synthetic-secret-owner' } },
    { payload: { image, kind: 'login', question: 'digits' }, ownerScope: 'synthetic-secret-owner' },
  ]) await assert.rejects(f.run('captcha', body), (error: unknown) => {
    assert.equal((error as { status: number }).status, 400);
    assert.doesNotMatch(String(error), /synthetic-secret/);
    return true;
  });
  await assert.rejects(f.run('captcha', { payload: { image, kind: 'cafe-join' } }), { code: 'task_scope_denied', status: 403 });
  await assert.rejects(f.run('captcha-authorize', { captchaKind: 'cafe-create' }), { code: 'task_scope_denied', status: 403 });
  assert.equal(f.calls.length, 0);
});

test('an answer is withheld if the lease, status, owner or freshness changes while solving', async () => {
  for (const mutate of [
    (f: ReturnType<typeof fixture>) => { f.row.claimedBy = 'other-worker'; },
    (f: ReturnType<typeof fixture>) => { f.row.status = 'needs_review'; },
    (f: ReturnType<typeof fixture>) => { f.row.userId = 'other-owner'; },
    (f: ReturnType<typeof fixture>) => { f.advance(); },
  ]) {
    const f = fixture();
    f.afterForward(() => mutate(f));
    await assert.rejects(f.run('captcha', { payload: { image, kind: 'login', question: 'digits' } }), { code: 'lease_lost', status: 409 });
    assert.equal(f.calls.length, 1);
  }
});
