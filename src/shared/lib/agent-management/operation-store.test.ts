import assert from 'node:assert/strict';
import { test } from 'node:test';
import { enqueueIdempotentOperation } from '@/shared/lib/agent-management/operation-store';
import type { AgentOperationInput } from '@/shared/lib/agent-management/contract';

test('concurrent retries create one job, owner scopes differ, and payload changes conflict', async () => {
  const rows = new Map<string, { userId: string; fingerprint: string; input: AgentOperationInput }>();
  const store = {
    find: async (userId: string, id: string) => rows.get(id)?.userId === userId ? rows.get(id)! : null,
    create: async (userId: string, id: string, fingerprint: string, input: AgentOperationInput) => {
      if (rows.has(id)) throw Object.assign(new Error('duplicate'), { code: 11000 });
      const row = { userId, fingerprint, input }; rows.set(id, row); return row;
    },
  };
  const input: AgentOperationInput = { type: 'write_comment', accountId: 'naver', cafeId: '1', articleId: 1, content: 'hi' };
  const result = await Promise.all(Array.from({ length: 8 }, () => enqueueIdempotentOperation(store, 'owner', 'key', input)));
  assert.equal(rows.size, 1);
  assert.equal(result.filter(({ replayed }) => !replayed).length, 1);
  await assert.rejects(enqueueIdempotentOperation(store, 'owner', 'key', { ...input, content: 'other' }), { code: 'idempotency_conflict' });
  await enqueueIdempotentOperation(store, 'other', 'key', input);
  assert.equal(rows.size, 2);
});
