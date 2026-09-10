import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { managementCapabilities } from '../src/shared/lib/agent-management/capabilities';
import { parseOperation } from '../src/shared/lib/agent-management/contract';

for (const capability of managementCapabilities) {
  assert.ok(capability.inputSchema, capability.id);
  const route = capability.path.replace(/\{([^}]+)\}/g, '[$1]');
  assert.ok(existsSync(`src/app${route}/route.ts`), capability.path);
  if (capability.workerRequired) assert.equal(capability.result?.acceptanceIsCompletion, false);
}
assert.deepEqual(parseOperation({ type: 'join_cafe', accountId: 'test', cafeId: '123', nickname: 'n'.repeat(30) }).nickname?.length, 30);
assert.throws(() => parseOperation({ type: 'write_comment', accountId: 'test', cafeId: '123', articleId: 1, content: 'x'.repeat(3001) }));
console.log('agent capabilities harness passed');
