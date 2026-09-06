import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseAccountRegistration, parseCafeRegistration, parseOperation,
  operationIdentity, toSafeAccount, AgentManagementError,
} from '@/shared/lib/agent-management/contract';

test('rejects owner injection, credentials in operations, invalid ids and unrelated fields', () => {
  for (const body of [
    { type: 'join_cafe', accountId: 'naver', cafeId: '1', userId: 'other' },
    { type: 'join_cafe', accountId: 'naver', cafeId: '1', password: 'secret' },
    { type: 'write_comment', accountId: 'naver', cafeId: '1', articleId: 0, content: 'hello' },
    { type: 'write_comment', accountId: 'naver', cafeId: '1', articleId: 2, content: ' ' },
    { type: 'join_cafe', accountId: 'naver', cafeId: '../1' },
    null, [],
  ]) assert.throws(() => parseOperation(body), AgentManagementError);
});

test('normalizes valid operations and scopes deterministic idempotency identities to owner', () => {
  const input = parseOperation({ type: 'write_comment', accountId: ' naver ', cafeId: '123', articleId: 5, content: ' hello ' });
  assert.equal(input.content, 'hello');
  const first = operationIdentity('owner', 'request-1', input);
  assert.deepEqual(first, operationIdentity('owner', 'request-1', { ...input }));
  assert.notEqual(first.id, operationIdentity('other', 'request-1', input).id);
  assert.equal(first.id, operationIdentity('owner', 'request-1', { ...input, content: 'different' }).id);
  assert.notEqual(first.fingerprint, operationIdentity('owner', 'request-1', { ...input, content: 'different' }).fingerprint);
  assert.throws(() => operationIdentity('owner', '', input), AgentManagementError);
});

test('registration requires exact valid fields and only Naver cafe slugs or URLs', () => {
  assert.equal(parseAccountRegistration({ accountId: 'naver', password: ' secret ' }).password, ' secret ');
  assert.throws(() => parseAccountRegistration({ accountId: 'naver', password: 'secret', apiKeys: {} }));
  assert.throws(() => parseCafeRegistration({ cafeId: '1', menuId: '2', name: 'Cafe', cafeUrl: 'https://evil.com/cafe' }));
  assert.equal(parseCafeRegistration({ cafeId: '1', menuId: '2', name: 'Cafe', cafeUrl: 'https://cafe.naver.com/cafeslug' }).cafeUrl, 'cafeslug');
});

test('safe account metadata never exposes passwords or API keys', () => {
  const safe = toSafeAccount({ accountId: 'naver', password: 'secret', nickname: 'Name', isActive: true, apiKeys: { gemini: 'key' } });
  assert.deepEqual(safe, { accountId: 'naver', nickname: 'Name', role: undefined, isActive: true, hasPassword: true });
  assert.ok(!JSON.stringify(safe).includes('secret'));
  assert.ok(!JSON.stringify(safe).includes('gemini'));
});
