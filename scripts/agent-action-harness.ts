import { enqueueIdempotentRequest } from '../src/shared/lib/agent-management/idempotent-request';
import assert from 'node:assert/strict';
import { parseRemoteAction, actionResources, ACTION_TYPES } from '../src/shared/lib/agent-management/action-contract';
import { actionCapabilities } from '../src/shared/lib/agent-management/action-capabilities';
import { safeActionResult } from '../src/shared/lib/agent-management/action-result';

assert.deepEqual(actionCapabilities.map(({ id }) => id), [...ACTION_TYPES]);
assert.deepEqual(actionResources(parseRemoteAction({ type: 'exposure-check', accountId: 'account', items: [{ cafeId: '12', keyword: 'first' }, { cafeId: '12', keyword: 'second' }] })), { accountIds: ['account'], cafeIds: ['12'] });
assert.throws(() => parseRemoteAction({ type: 'nickname-change', mode: 'anything' }));
assert.throws(() => parseRemoteAction({ type: 'cafe-join-all', accountId: 'ignored' }));
assert.throws(() => parseRemoteAction({ type: 'account-login', accountId: 'a', password: 'secret' }));
assert.throws(() => parseRemoteAction({ type: 'manual-publish', input: { cafeId: '1', manuscripts: [{ folderName: 'test', title: 'test', htmlContent: '<p>test</p>', images: ['/private/file'] }] } }));
assert.throws(() => parseRemoteAction({ type: 'rewrite', input: { cafeIds: ['1'], dateFrom: '2026-02-30', dateTo: '2026-03-01', keywordSource: 'pool' } }));
assert.throws(() => parseRemoteAction({ type: 'rewrite', input: { cafeIds: ['1'], dateFrom: '2026-03-02', dateTo: '2026-03-01', keywordSource: 'pool' } }));
const result = safeActionResult({ success: false, error: 'secret', result: { completed: 1, password: 'secret', results: [{ success: true, articleId: 123, articleUrl: 'https://cafe.naver.com/test/123', error: 'secret' }] } });
assert.equal(JSON.stringify(result).includes('secret'), false);
assert.ok(JSON.stringify(result).includes('https://cafe.naver.com/test/123'));
assert.equal((safeActionResult({ success: true, result: { results: Array.from({ length: 250 }, (_, articleId) => ({ articleId, success: true })) } }).result as { results: unknown[] }).results.length, 250);
console.log('agent action validation/result harness passed');

const testIdempotency = async () => {
  const rows = new Map<string, { fingerprint: string; input: unknown }>();
  let writes = 0;
  const store = {
    find: async (_owner: string, id: string) => rows.get(id) ?? null,
    create: async (_owner: string, id: string, fingerprint: string, input: unknown) => {
      if (rows.has(id)) throw { code: 11000 };
      writes += 1; const row = { fingerprint, input }; rows.set(id, row); return row;
    },
  };
  await Promise.all([enqueueIdempotentRequest(store, 'a', 'key', { type: 'account-login' }), enqueueIdempotentRequest(store, 'a', 'key', { type: 'account-login' })]);
  assert.equal(writes, 1);
  await assert.rejects(() => enqueueIdempotentRequest(store, 'a', 'key', { type: 'cafe-create' }));
  await enqueueIdempotentRequest(store, 'b', 'key', { type: 'account-login' });
  assert.equal(writes, 2);
  console.log('action idempotency/concurrency/owner harness passed');
};
void testIdempotency();
