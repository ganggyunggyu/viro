import assert from 'node:assert/strict';
import test from 'node:test';
import { createSchedulerClient } from './scheduler-client';
import { hasCaptchaApiConfig, solveCaptchaViaScheduler, withCaptchaSolver } from '../../src/shared/lib/captcha-client';
import { safeOperationFailure } from '../../src/shared/lib/agent-management/operation-failure';
const config = { brokerUrl: 'https://viro.example', serviceSecret: 's'.repeat(32), workerId: 'worker', browsersPath: '/tmp/browser', pollIntervalMs: 15000, kind: 'action' as const, id: 'a'.repeat(64), dispatchId: 'b'.repeat(64), ownerScope: 'c'.repeat(64) };
const setup = (response = () => Response.json({ answer: '1234', kind: 'login' })) => {
  const requests: Array<{ path: string; body: Record<string, unknown> }> = [];
  const client = createSchedulerClient(config, (async (url, init) => {
    const path = new URL(String(url)).pathname; const body = JSON.parse(String(init?.body)); requests.push({ path, body });
    return path.endsWith('/claim') ? Response.json({ claimed: { ownerScope: config.ownerScope, leaseId: '11111111-1111-4111-8111-111111111111', task: { id: config.id, status: 'running' } } }) : response();
  }) as typeof fetch);
  return { client, requests };
};
test('configured scoped captcha solver delegates all kinds through the claimed exact task instead of a disabled stub', async () => {
  for (const kind of ['login', 'cafe-join', 'cafe-create'] as const) {
    const { client, requests } = setup(() => Response.json({ answer: ' 1234 ', kind }));
    await client.claimAction(config.id);
    await withCaptchaSolver(client.solveCaptcha, async () => {
      assert.equal(hasCaptchaApiConfig({}), true);
      assert.equal(await solveCaptchaViaScheduler({ image: 'aW1hZ2U=', kind, question: 'fixture' }), '1234');
    });
    assert.equal(requests.length, 2);
    assert.equal(requests[1].path, `/api/agent/scheduler/tasks/action/${config.id}/captcha`);
    assert.deepEqual(requests[1].body.payload, { image: 'aW1hZ2U=', kind, question: 'fixture' });
    assert.equal(requests[1].body.dispatchId, config.dispatchId);
    assert.equal(typeof requests[1].body.leaseId, 'string');
  }
});
test('unclaimed captcha cannot make a network request', async () => {
  const { client, requests } = setup();
  await assert.rejects(client.solveCaptcha({ image: 'aW1hZ2U=', kind: 'login', question: 'fixture' }));
  assert.equal(requests.length, 0);
});
test('captcha infrastructure errors stay distinct and never expose upstream error bodies', async () => {
  for (const [status, expected] of [[401, 'captcha_service_authentication_required'], [503, 'captcha_service_unavailable'], [502, 'captcha_service_invalid_response']] as const) {
    const { client } = setup(() => Response.json({ error: 'private-token' }, { status }));
    await client.claimAction(config.id);
    await assert.rejects(client.solveCaptcha({ image: 'aW1hZ2U=', kind: 'login', question: 'fixture' }), (error: unknown) => {
      assert.equal((error as { code: string }).code, expected);
      const safe = safeOperationFailure((error as Error).message);
      assert.equal(safe.errorCode, expected);
      assert.doesNotMatch(JSON.stringify(safe), /private-token/);
      return true;
    });
  }
});
test('empty, wrong-kind and oversized answers cannot be used as captcha answers', async () => {
  for (const response of [{ answer: '', kind: 'login' }, { answer: 'x', kind: 'cafe-join' }, { answer: 'x'.repeat(1001), kind: 'login' }]) {
    const { client } = setup(() => Response.json(response)); await client.claimAction(config.id);
    await assert.rejects(client.solveCaptcha({ image: 'aW1hZ2U=', kind: 'login', question: 'fixture' }), (error: unknown) => (error as { code: string }).code === 'captcha_service_invalid_response');
  }
});

test('serialized Viro failures preserve allowed service codes even when they share HTTP 502', async () => {
  for (const code of ['captcha_service_authentication_required', 'captcha_service_unavailable', 'captcha_service_invalid_response']) {
    const { client } = setup(() => Response.json({ error: 'private-message', code }, { status: 502 }));
    await client.claimAction(config.id);
    await assert.rejects(client.solveCaptcha({ image: 'aW1hZ2U=', kind: 'login', question: 'fixture' }), (error: unknown) => (error as { code: string }).code === code);
  }
});
