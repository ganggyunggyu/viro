import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTaskCaptchaPayload, assertTaskCaptchaKind, type CaptchaKind } from './captcha-contract';
import type { SchedulerTask } from './task-contract';

const image = Buffer.from('test-image').toString('base64');
const task = (kind: 'operation' | 'action', type: string): SchedulerTask => ({
  kind, id: 'a'.repeat(kind === 'operation' ? 24 : 64), dispatchId: 'b'.repeat(64), userId: 'owner', status: 'running',
  ...(kind === 'operation' ? { operation: { type, accountId: 'account', cafeId: '123' } } : { action: { type, accountId: 'account' } }),
} as SchedulerTask);

test('captcha payload accepts three kinds and normalizes the required login question', () => {
  for (const kind of ['login', 'cafe-join', 'cafe-create'] as const) {
    assert.deepEqual(parseTaskCaptchaPayload({ image, kind, question: ' question ' }), { image, kind, question: 'question' });
  }
  assert.deepEqual(parseTaskCaptchaPayload({ image, kind: 'cafe-create' }), { image, kind: 'cafe-create' });
});

test('captcha payload rejects owner fields, unknown kinds, malformed images and invalid questions', () => {
  for (const raw of [
    { image, kind: 'other' }, { image, kind: 'login' }, { image, kind: 'login', question: ' ' },
    { image, kind: 'login', question: 'q', ownerScope: 'injected' }, { image, kind: 'cafe-join', password: 'injected' },
    { image: 'data:image/png;base64,' + image, kind: 'cafe-create' },
    { image: '!!!!', kind: 'cafe-create' }, { image: 'Zh==', kind: 'cafe-create' },
    { image: '', kind: 'cafe-create' }, { image, kind: 'login', question: 'q'.repeat(2001) },
    null, [],
  ]) assert.throws(() => parseTaskCaptchaPayload(raw), { status: 400 });
});

test('captcha enforces decoded and encoded image limits including equal-length encodings', () => {
  const maximum = Buffer.alloc(1_048_576).toString('base64');
  assert.equal(parseTaskCaptchaPayload({ image: maximum, kind: 'cafe-create' }).image.length, 1_398_104);
  const oversizedDecoded = Buffer.alloc(1_048_577).toString('base64');
  assert.equal(oversizedDecoded.length, maximum.length);
  assert.throws(() => parseTaskCaptchaPayload({ image: oversizedDecoded, kind: 'cafe-create' }), { status: 400 });
  assert.throws(() => parseTaskCaptchaPayload({ image: 'A'.repeat(1_398_108), kind: 'cafe-create' }), { status: 400 });
});

test('captcha kinds are restricted to the stored browser task', () => {
  for (const type of ['join_cafe', 'write_comment']) assert.doesNotThrow(() => assertTaskCaptchaKind(task('operation', type), 'login'));
  for (const type of ['account-login', 'cafe-join-all', 'nickname-change', 'exposure-check', 'cafe-create', 'manual-publish', 'manual-modify', 'rewrite']) assert.doesNotThrow(() => assertTaskCaptchaKind(task('action', type), 'login'));
  assert.doesNotThrow(() => assertTaskCaptchaKind(task('operation', 'join_cafe'), 'cafe-join'));
  assert.doesNotThrow(() => assertTaskCaptchaKind(task('action', 'cafe-join-all'), 'cafe-join'));
  assert.doesNotThrow(() => assertTaskCaptchaKind(task('action', 'cafe-create'), 'cafe-create'));
  for (const [input, kind] of [[task('operation', 'write_comment'), 'cafe-join'], [task('action', 'manual-publish'), 'cafe-join'], [task('action', 'account-login'), 'cafe-create'], [task('operation', 'join_cafe'), 'cafe-create']] as Array<[SchedulerTask, CaptchaKind]>) assert.throws(() => assertTaskCaptchaKind(input, kind), { status: 403 });
});
