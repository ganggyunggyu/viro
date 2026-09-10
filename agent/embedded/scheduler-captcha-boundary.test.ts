import assert from 'node:assert/strict';
import test from 'node:test';
import { createSchedulerClient } from './scheduler-client';
import { withSchedulerAuth } from '../../src/shared/lib/agent-scheduler/route';
import { forwardTaskCaptcha } from '../../src/shared/lib/agent-scheduler/captcha-forward';
import { ownerScope, type SchedulerTask } from '../../src/shared/lib/agent-scheduler/task-contract';
import { safeActionResult } from '../../src/shared/lib/agent-management/action-result';

const config = { brokerUrl: 'https://viro.example', serviceSecret: 's'.repeat(32), workerId: 'worker', browsersPath: '/tmp/browser', pollIntervalMs: 15000, kind: 'action' as const, id: 'a'.repeat(64), dispatchId: 'b'.repeat(64), ownerScope: ownerScope('fixture-owner') };
const leaseId = '11111111-1111-4111-8111-111111111111';
const task: SchedulerTask = { ...config, userId: 'fixture-owner', status: 'running', claimedBy: `scheduler:worker:${leaseId}`, claimedAt: new Date() };

test('actual Viro HTTP serialization preserves each scheduler failure code through embedded and action result boundaries', async () => {
  const previous = process.env.VIRO_SCHEDULER_SERVICE_SECRET;
  process.env.VIRO_SCHEDULER_SERVICE_SECRET = config.serviceSecret;
  try {
    for (const [status, code] of [[403, 'captcha_service_authentication_required'], [503, 'captcha_service_unavailable'], [502, 'captcha_service_invalid_response']] as const) {
      const handler = withSchedulerAuth(async () => forwardTaskCaptcha(task, config.workerId, leaseId, { image: 'aW1hZ2U=', kind: 'login', question: 'fixture' }, {
        environment: { VIRO_SCHEDULER_URL: 'https://scheduler.example', VIRO_SCHEDULER_SERVICE_SECRET: config.serviceSecret },
        fetcher: (async () => Response.json({ error: code, detail: 'private-token' }, { status })) as typeof fetch,
      }));
      const client = createSchedulerClient(config, (async (url, init) => String(url).endsWith('/claim')
        ? Response.json({ claimed: { ownerScope: config.ownerScope, leaseId, task: { id: config.id, status: 'running' } } })
        : handler(new Request(String(url), init), undefined)) as typeof fetch);
      await client.claimAction(config.id);
      await assert.rejects(client.solveCaptcha({ image: 'aW1hZ2U=', kind: 'login', question: 'fixture' }), (error: unknown) => {
        assert.equal((error as { code: string }).code, code);
        const result = safeActionResult({ success: false, error: (error as Error).message });
        assert.equal(result.errorCode, code);
        assert.doesNotMatch(JSON.stringify(result), /private-token/);
        return true;
      });
    }
  } finally {
    if (previous === undefined) delete process.env.VIRO_SCHEDULER_SERVICE_SECRET;
    else process.env.VIRO_SCHEDULER_SERVICE_SECRET = previous;
  }
});
