import assert from 'node:assert/strict';
import test from 'node:test';

import { discoverTestFiles, selectTestFiles } from './test-suite-discovery';

test('discoverTestFiles includes orphaned source and script tests', () => {
  const files = discoverTestFiles('harness');

  assert.ok(files.includes('src/features/viral/viral-parser.test.ts'));
  assert.ok(files.includes('src/features/viral/prompts/build-hanryeo-cafe-prompt.test.ts'));
  assert.ok(files.includes('src/shared/config/cafe-account-policy.test.ts'));
  assert.ok(files.includes('src/shared/lib/password.test.ts'));
  assert.ok(files.includes('scripts/cafe-unexposed-keyword-selector.test.ts'));
  assert.ok(files.includes('scripts/verify-cafe-posts.test.ts'));
  assert.ok(files.includes('src/shared/lib/naver-cafe-writing/article-modifier-utils.test.ts'));
});

test('selectTestFiles keeps live tests out of the harness suite', () => {
  const files = [
    'src/example.test.ts',
    'scripts/example.live.test.ts',
    'src/example.integration.test.ts',
  ];

  assert.deepEqual(selectTestFiles(files, 'harness'), ['src/example.test.ts']);
  assert.deepEqual(selectTestFiles(files, 'live'), [
    'scripts/example.live.test.ts',
    'src/example.integration.test.ts',
  ]);
});
