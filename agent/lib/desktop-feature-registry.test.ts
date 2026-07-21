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

test('desktop navigation has product-ready groups, descriptions, and vector icons', () => {
  assert.deepEqual(
    [...new Set(DESKTOP_FEATURES.map(({ group }) => group))],
    ['overview', 'work', 'manage', 'system'],
  );
  for (const { description, iconPath } of DESKTOP_FEATURES) {
    assert.ok(description.length >= 8);
    assert.match(iconPath, /^[Mm]/);
  }
});
