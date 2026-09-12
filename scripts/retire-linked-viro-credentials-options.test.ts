import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRetirementOptions } from './retire-linked-viro-credentials-options';

test('explicit owner and central IDs are required and default to dry-run', () => {
  assert.deepEqual(parseRetirementOptions(['--user-id', 'owner', '--dabut-user-id', 'central']), { userId: 'owner', dabutUserId: 'central', apply: false });
  assert.equal(parseRetirementOptions(['--user-id', 'owner', '--dabut-user-id', 'central', '--apply']).apply, true);
});

test('ambiguous, unknown and partial selectors are rejected before connecting', () => {
  for (const args of [[], ['--all'], ['--user-id', 'owner'], ['--user-id', 'owner', '--dabut-user-id', '--apply'], ['--user-id', 'owner', '--dabut-user-id', 'central', '--user-id', 'other']]) {
    assert.throws(() => parseRetirementOptions(args));
  }
});
