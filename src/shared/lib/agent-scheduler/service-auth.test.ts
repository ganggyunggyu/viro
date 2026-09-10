import assert from 'node:assert/strict';
import test from 'node:test';
import { signSchedulerRequest, verifySchedulerRequest } from './service-auth';

const secret = 'local-test-service-secret-32-bytes-minimum';
const pathname = '/api/agent/scheduler/tasks/operation/' + 'a'.repeat(24) + '/claim';
const body = JSON.stringify({ dispatchId: 'b'.repeat(64), workerId: 'test-worker' });
const request = (headers: Record<string, string>, path = pathname, method = 'POST') => new Request(`https://viro.invalid${path}`, { method, headers });

test('service signature binds timestamp, method, path and exact body', () => {
  const headers = signSchedulerRequest(secret, 'POST', pathname, body, 1000);
  assert.equal(verifySchedulerRequest(secret, request(headers), body, 1000), true);
  assert.equal(verifySchedulerRequest(secret, request(headers), body + ' ', 1000), false);
  assert.equal(verifySchedulerRequest(secret, request(headers, pathname + '/other'), body, 1000), false);
  assert.equal(verifySchedulerRequest(secret, request(headers, pathname, 'GET'), body, 1000), false);
  assert.equal(verifySchedulerRequest(secret + 'other', request(headers), body, 1000), false);
});

test('service auth rejects expired, future, missing and malformed signatures and short keys', () => {
  const headers = signSchedulerRequest(secret, 'POST', pathname, body, 1000);
  assert.equal(verifySchedulerRequest(secret, request(headers), body, 1060), true);
  assert.equal(verifySchedulerRequest(secret, request(headers), body, 1061), false);
  assert.equal(verifySchedulerRequest(secret, request(headers), body, 939), false);
  assert.equal(verifySchedulerRequest(secret, request({}), body, 1000), false);
  assert.equal(verifySchedulerRequest(secret, request({ ...headers, 'x-viro-signature': 'ff' }), body, 1000), false);
  assert.equal(verifySchedulerRequest(secret, request({ ...headers, 'x-viro-timestamp': '1000.0' }), body, 1000), false);
  assert.equal(verifySchedulerRequest('', request(headers), body, 1000), false);
  assert.throws(() => signSchedulerRequest('short', 'POST', pathname, body, 1000));
});
