import assert from 'node:assert/strict';
import test from 'node:test';
import { DESKTOP_FEATURES } from './desktop-feature-registry';

test('desktop UI exposes every local browser workflow', () => {
  assert.deepEqual(
    DESKTOP_FEATURES.map(({ id }) => id),
    ['home', 'publish', 'manuscript', 'comments', 'exposure', 'accounts', 'cafes', 'rewrite', 'logs', 'settings'],
  );
  assert.equal(DESKTOP_FEATURES.filter(({ localExecution }) => localExecution).length, 7);
});
