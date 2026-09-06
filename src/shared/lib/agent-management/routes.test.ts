import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GET as capabilities } from '@/app/api/agent/capabilities/route';
import { GET as accounts, POST as registerAccount } from '@/app/api/agent/naver-accounts/route';
import { POST as registerCafe } from '@/app/api/agent/cafes/route';
import { GET as operations, POST as enqueue } from '@/app/api/agent/operations/route';
import { POST as claim } from '@/app/api/agent/operations/claim/route';
import { POST as heartbeat } from '@/app/api/agent/operations/heartbeat/route';
import { POST as report } from '@/app/api/agent/operations/result/route';

test('every management and worker operation endpoint rejects missing authentication before data access', async () => {
  for (const handler of [capabilities, accounts, registerAccount, registerCafe, operations, enqueue, claim, heartbeat, report]) {
    const response = await handler(new Request('https://viro.example/api/agent/test'), undefined);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'unauthorized', code: 'unauthorized' });
  }
});
