import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';
import test from 'node:test';
import { buildPlaywrightInstallCommand } from './ensure-chromium';

test('buildPlaywrightInstallCommand resolves the CLI without using a blocked package subpath', () => {
  const command = buildPlaywrightInstallCommand({ TEST_VALUE: 'kept' }, '/path/to/electron');

  assert.equal(command.executable, '/path/to/electron');
  assert.equal(basename(command.args[0] ?? ''), 'cli.js');
  assert.equal(existsSync(command.args[0] ?? ''), true);
  assert.deepEqual(command.args.slice(1), ['install', 'chromium']);
  assert.equal(command.env.TEST_VALUE, 'kept');
  assert.equal(command.env.ELECTRON_RUN_AS_NODE, '1');
});
