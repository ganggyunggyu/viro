import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

test('CLI exits unsuccessfully before connecting without explicit selectors and database name', () => {
  const require = createRequire(import.meta.url);
  const cli = fileURLToPath(new URL('./retire-linked-viro-credentials.ts', import.meta.url));
  const env = { ...process.env, MONGODB_URI: 'synthetic-uri-must-not-print', MONGODB_DB: '' };
  for (const args of [[], ['--apply'], ['--user-id', 'owner', '--dabut-user-id', 'central']]) {
    const result = spawnSync(process.execPath, [require.resolve('tsx/cli'), cli, ...args], { env, encoding: 'utf8', timeout: 10_000 });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Credential retirement failed/);
    assert.equal(result.stderr.includes(env.MONGODB_URI), false);
    assert.equal(result.stdout, '');
  }
});
