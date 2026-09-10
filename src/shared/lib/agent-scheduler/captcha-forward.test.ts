import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { test } from 'node:test';
import { forwardTaskCaptcha } from '@/shared/lib/agent-scheduler/captcha-forward';
import type { TaskCaptchaPayload } from '@/shared/lib/agent-scheduler/captcha-contract';
import type { SchedulerTask } from '@/shared/lib/agent-scheduler/task-contract';
import { AgentManagementError } from '@/shared/lib/agent-management/contract';

const task: SchedulerTask = {
  kind: 'operation', id: 'a'.repeat(24), dispatchId: 'b'.repeat(64), userId: 'private-owner', status: 'running',
  claimedBy: 'scheduler:worker:lease', result: { private: 'do not forward' },
};
const captcha: TaskCaptchaPayload = { image: 'YWJj', kind: 'login', question: '질문' };
const leaseId = '00000000-0000-4000-8000-000000000000';
const environment = { VIRO_SCHEDULER_URL: 'https://scheduler.example', VIRO_SCHEDULER_SERVICE_SECRET: 's'.repeat(32) };
const call = (fetcher: typeof fetch, config = environment) => forwardTaskCaptcha(task, 'worker', leaseId, captcha, { fetcher, environment: config });
const failure = (code: string) => (error: unknown) => {
  assert.ok(error instanceof AgentManagementError);
  assert.equal(error.status, 502); assert.equal(error.code, code);
  assert.ok(!error.message.includes('private-token')); assert.ok(!error.message.includes('private upstream')); assert.ok(!error.message.includes(environment.VIRO_SCHEDULER_SERVICE_SECRET));
  return true;
};

test('forwards exact task identity, hashed owner scope and captcha through signed POST with a 75-second timeout', async (context) => {
  const signal = new AbortController().signal;
  const timeout = context.mock.method(AbortSignal, 'timeout', (duration: number) => { assert.equal(duration, 75_000); return signal; });
  const fetcher: typeof fetch = async (url, options) => {
    assert.equal(String(url), 'https://scheduler.example/viro/captcha');
    assert.equal(options?.method, 'POST'); assert.equal(options?.redirect, 'error'); assert.equal(options?.signal, signal);
    const headers = new Headers(options?.headers);
    assert.equal(headers.get('content-type'), 'application/json');
    assert.equal(headers.get('authorization'), null);
    const body = String(options?.body);
    assert.deepEqual(JSON.parse(body), { task: { kind: task.kind, id: task.id, dispatchId: task.dispatchId }, workerId: 'worker', leaseId,
      ownerScope: createHash('sha256').update(task.userId).digest('hex'), captcha });
    const expected = createHmac('sha256', environment.VIRO_SCHEDULER_SERVICE_SECRET)
      .update(`${headers.get('x-viro-timestamp')}\nPOST\n/viro/captcha\n${body}`).digest('hex');
    assert.equal(headers.get('x-viro-signature'), expected);
    assert.ok(!body.includes('private-owner')); assert.ok(!body.includes('do not forward'));
    return Response.json({ answer: '  한글Ab12  ', kind: 'login' });
  };
  assert.deepEqual(await call(fetcher), { answer: '한글Ab12', kind: 'login' });
  assert.equal(timeout.mock.callCount(), 1);
});

test('missing or short service secret fails before fetch and explicit empty environment never falls back', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls += 1; throw new Error('private upstream'); };
  for (const secret of [undefined, '', 'x'.repeat(31)]) {
    await assert.rejects(forwardTaskCaptcha(task, 'worker', leaseId, captcha, { fetcher,
      environment: { VIRO_SCHEDULER_URL: environment.VIRO_SCHEDULER_URL, VIRO_SCHEDULER_SERVICE_SECRET: secret } }), failure('captcha_service_authentication_required'));
  }
  await assert.rejects(forwardTaskCaptcha(task, 'worker', leaseId, captcha, { fetcher, environment: {} }), failure('captcha_service_authentication_required'));
  assert.equal(calls, 0);
});

test('invalid origins fail closed before fetch', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls += 1; throw new Error('private upstream'); };
  for (const url of ['', 'not a url', 'http://remote.example', 'file:///tmp/private', 'https://user:password@example.com',
    'https://example.com/path', 'https://example.com/?secret=value', 'https://example.com/#fragment']) {
    await assert.rejects(call(fetcher, { ...environment, VIRO_SCHEDULER_URL: url }), failure('captcha_service_unavailable'));
  }
  assert.equal(calls, 0);
});

test('HTTPS and explicit loopback HTTP origins accept secrets measured in UTF-8 bytes', async () => {
  for (const url of ['https://scheduler.example/', 'http://localhost:3007', 'http://127.0.0.1:3007', 'http://[::1]:3007']) {
    const fetcher: typeof fetch = async (target) => {
      assert.equal(String(target), `${url.replace(/\/$/, '')}/viro/captcha`);
      return Response.json({ answer: '정답', kind: 'login' });
    };
    assert.deepEqual(await call(fetcher, { VIRO_SCHEDULER_URL: url, VIRO_SCHEDULER_SERVICE_SECRET: '한'.repeat(11) }), { answer: '정답', kind: 'login' });
  }
});

test('unknown failure HTTP bodies are not reflected and bypass unbounded json or text readers', async (context) => {
  for (const status of [401, 403, 400, 404, 429, 500, 502, 503, 302]) {
    const response = new Response('private upstream', { status });
    const read = context.mock.method(response, 'json', async () => { throw new Error('private upstream'); });
    const text = context.mock.method(response, 'text', async () => { throw new Error('private upstream'); });
    const fetcher: typeof fetch = async () => response;
    await assert.rejects(call(fetcher), failure(status === 401 || status === 403 ? 'captcha_service_authentication_required' : 'captcha_service_unavailable'));
    assert.equal(read.mock.callCount(), 0); assert.equal(text.mock.callCount(), 0);
  }
});

test('fetch errors, aborts and timeouts always use the fixed unavailable error', async () => {
  for (const error of [new Error('private upstream'), new TypeError('private upstream'), new DOMException('private upstream', 'AbortError'), new DOMException('private upstream', 'TimeoutError')]) {
    const fetcher: typeof fetch = async () => { throw error; };
    await assert.rejects(call(fetcher), failure('captcha_service_unavailable'));
  }
});

test('malformed JSON, blank or long answers, unexpected fields and mismatched kinds are rejected', async () => {
  for (const data of [null, [], 'answer', 42, {}, { answer: 'ok' }, { kind: 'login' },
    { answer: '', kind: 'login' }, { answer: ' \n ', kind: 'login' }, { answer: 123, kind: 'login' },
    { answer: 'x'.repeat(1001), kind: 'login' }, { answer: ' '.repeat(1000) + 'x', kind: 'login' }, { answer: 'ok', kind: 'cafe-join' }, { answer: 'ok', kind: 'unknown' },
    { answer: 'ok', kind: 'login', extra: 'private upstream' }]) {
    await assert.rejects(call(async () => Response.json(data)), failure('captcha_service_invalid_response'));
  }
  await assert.rejects(call(async () => new Response('{malformed', { status: 200 })), failure('captcha_service_invalid_response'));
});

test('all known captcha kinds preserve their exact answer text after trimming', async () => {
  for (const kind of ['login', 'cafe-join', 'cafe-create'] as const) {
    const answer = '한글123ABC'.repeat(125).slice(0, 998);
    const result = await forwardTaskCaptcha(task, 'worker', leaseId, { ...captcha, kind }, {
      environment, fetcher: async () => Response.json({ answer: ` ${answer} `, kind }),
    });
    assert.deepEqual(result, { answer, kind });
  }
});

test('response stream failures are reported as unavailable without exposing their causes', async () => {
  for (const error of [new TypeError('private upstream'), new DOMException('private upstream', 'AbortError'), new DOMException('private upstream', 'TimeoutError')]) {
    const response = new Response(new ReadableStream({ start: (controller) => controller.error(error) }));
    await assert.rejects(call(async () => response), failure('captcha_service_unavailable'));
  }
});

test('action identity uses only its exact reference and the default environment and fetcher are supported', async (context) => {
  const oldUrl = process.env.VIRO_SCHEDULER_URL;
  const oldSecret = process.env.VIRO_SCHEDULER_SERVICE_SECRET;
  process.env.VIRO_SCHEDULER_URL = environment.VIRO_SCHEDULER_URL;
  process.env.VIRO_SCHEDULER_SERVICE_SECRET = environment.VIRO_SCHEDULER_SERVICE_SECRET;
  context.after(() => {
    if (oldUrl === undefined) delete process.env.VIRO_SCHEDULER_URL;
    else process.env.VIRO_SCHEDULER_URL = oldUrl;
    if (oldSecret === undefined) delete process.env.VIRO_SCHEDULER_SERVICE_SECRET;
    else process.env.VIRO_SCHEDULER_SERVICE_SECRET = oldSecret;
  });
  const action: SchedulerTask = { ...task, kind: 'action', id: 'c'.repeat(64), action: { type: 'cafe-create', input: {
    ownerAccountId: 'private-account', name: '카페', slug: 'private-slug', presetKey: 'key', description: 'description', keywords: [],
  } } };
  const fetcher = context.mock.method(globalThis, 'fetch', async (_url: unknown, options?: RequestInit) => {
    const body = JSON.parse(String(options?.body));
    assert.deepEqual(body.task, { kind: 'action', id: action.id, dispatchId: action.dispatchId });
    assert.ok(!String(options?.body).includes('private-account'));
    return Response.json({ answer: '정답', kind: 'cafe-create' });
  });
  assert.deepEqual(await forwardTaskCaptcha(action, 'worker', leaseId, { image: captcha.image, kind: 'cafe-create' }), { answer: '정답', kind: 'cafe-create' });
  assert.equal(fetcher.mock.callCount(), 1);
});


test('non-success responses preserve only allowlisted captcha service codes with local messages', async () => {
  for (const suffix of ['authentication_required', 'unavailable', 'invalid_response']) {
    const code = `captcha_service_${suffix}`;
    for (const body of [{ code }, { error: code }, { code, error: 'private upstream' },
      { code, extra: 'private upstream' }, { error: code, detail: 'private-token' }]) {
      await assert.rejects(call(async () => Response.json(body, { status: 502 })), failure(code));
    }
  }
  for (const body of [{ code: 'private upstream' }, { error: 'private upstream' },
    { code: 'invalid', error: 'captcha_service_authentication_required' }, { code: 'captcha_service_authentication_required', error: {} }, []]) {
    await assert.rejects(call(async () => Response.json(body, { status: 502 })), failure('captcha_service_unavailable'));
  }
  await assert.rejects(call(async () => Response.json({ code: 'captcha_service_invalid_response' }, { status: 403 })), failure('captcha_service_invalid_response'));
});

test('answers containing any ASCII control character are rejected before trimming', async () => {
  for (const code of [...Array.from({ length: 32 }, (_, index) => index), 127]) {
    await assert.rejects(call(async () => Response.json({ answer: `a${String.fromCharCode(code)}b`, kind: 'login' })), failure('captcha_service_invalid_response'));
  }
});

test('response JSON is limited to 8192 actual bytes and oversized streams are cancelled', async () => {
  const errorBody = JSON.stringify({ code: 'captcha_service_authentication_required' });
  await assert.rejects(call(async () => new Response(errorBody.padEnd(8192, ' '), { status: 502 })), failure('captcha_service_authentication_required'));
  for (const status of [200, 502]) {
    let cancelled = 0;
    const bytes = Buffer.from(errorBody.padEnd(8193, ' '));
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => { controller.enqueue(bytes); },
      cancel: () => { cancelled += 1; },
    });
    await assert.rejects(call(async () => new Response(stream, { status })), failure(status === 200 ? 'captcha_service_invalid_response' : 'captcha_service_unavailable'));
    assert.equal(cancelled, 1);
  }
});
