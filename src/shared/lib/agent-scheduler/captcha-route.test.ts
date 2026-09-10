import assert from 'node:assert/strict';
import test from 'node:test';
import { withSchedulerAuth } from './route';
import { signSchedulerRequest } from './service-auth';
import { parseTaskBody } from './task-contract';
import { MAX_CAPTCHA_IMAGE_BYTES, MAX_CAPTCHA_REQUEST_LENGTH, parseTaskCaptchaPayload } from './captcha-contract';

const secret = 'test-service-secret-with-at-least-32-bytes';
const path = `/api/agent/scheduler/tasks/operation/${'a'.repeat(24)}/captcha`;
const payload = { image: Buffer.alloc(MAX_CAPTCHA_IMAGE_BYTES).toString('base64'), kind: 'login', question: 'digits' };
const body = { dispatchId: 'd'.repeat(64), workerId: 'worker-1', leaseId: '12345678-1234-4123-8123-123456789012', payload };
const request = (pathname: string, raw: string, signed = true) => new Request(`https://viro.test${pathname}`, { method: 'POST', headers: signed ? signSchedulerRequest(secret, 'POST', pathname, raw) : {}, body: raw });

test('authenticated captcha route admits a 1 MiB image and preserves the other verb body limit', async () => {
  const previous = process.env.VIRO_SCHEDULER_SERVICE_SECRET;
  process.env.VIRO_SCHEDULER_SERVICE_SECRET = secret;
  let called = 0;
  const route = withSchedulerAuth(async (input) => {
    called++;
    parseTaskCaptchaPayload(parseTaskBody('captcha', input).payload);
    return { answer: '1234', kind: 'login' };
  });
  try {
    const raw = JSON.stringify(body);
    const response = await route(request(path, raw), undefined);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await response.json(), { answer: '1234', kind: 'login' });
    assert.equal((await route(request(path.replace('/captcha', '/context'), raw), undefined)).status, 413);
    assert.equal((await route(request(path, ' '.repeat(MAX_CAPTCHA_REQUEST_LENGTH + 1)), undefined)).status, 413);
    assert.equal((await route(request(path, raw, false), undefined)).status, 401);
    assert.equal(called, 1);
  } finally {
    if (previous === undefined) delete process.env.VIRO_SCHEDULER_SERVICE_SECRET;
    else process.env.VIRO_SCHEDULER_SERVICE_SECRET = previous;
  }
});

test('captcha payload validation still rejects decoded oversize and owner injection after route authentication', async () => {
  const previous = process.env.VIRO_SCHEDULER_SERVICE_SECRET;
  process.env.VIRO_SCHEDULER_SERVICE_SECRET = secret;
  const route = withSchedulerAuth(async (input) => parseTaskCaptchaPayload(parseTaskBody('captcha', input).payload));
  try {
    for (const input of [
      { ...body, payload: { ...payload, image: Buffer.alloc(MAX_CAPTCHA_IMAGE_BYTES + 1).toString('base64') } },
      { ...body, ownerScope: 'synthetic-private-owner' },
    ]) {
      const response = await route(request(path, JSON.stringify(input)), undefined);
      assert.equal(response.status, 400);
      assert.doesNotMatch(await response.text(), /synthetic-private-owner|image|AAAA/);
    }
  } finally {
    if (previous === undefined) delete process.env.VIRO_SCHEDULER_SERVICE_SECRET;
    else process.env.VIRO_SCHEDULER_SERVICE_SECRET = previous;
  }
});
