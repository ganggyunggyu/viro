import assert from 'node:assert/strict';
import test from 'node:test';

import {
  planPublishedArticleIndexMigration,
  runPublishedArticleIndexMigration,
} from './migrate-published-article-index';

const LEGACY_INDEX = {
  name: 'cafeId_1_articleId_1',
  key: { cafeId: 1, articleId: 1 },
  unique: true,
};

const PARTIAL_INDEX = {
  ...LEGACY_INDEX,
  partialFilterExpression: { articleId: { $type: 'number' } },
};

test('index migration check plans replacement without writing', async () => {
  const writes: string[] = [];
  const collection = {
    listIndexes: () => ({ toArray: async () => [LEGACY_INDEX] }),
    dropIndex: async () => {
      writes.push('drop');
    },
    createIndex: async () => {
      writes.push('create');
      return 'cafeId_1_articleId_1';
    },
  };

  const plan = planPublishedArticleIndexMigration([LEGACY_INDEX]);
  const result = await runPublishedArticleIndexMigration(collection, 'check');

  assert.equal(plan, 'replace');
  assert.equal(result, 'replace');
  assert.deepEqual(writes, []);
});

test('index migration apply drops the legacy index before creating the partial index', async () => {
  const writes: string[] = [];
  const collection = {
    listIndexes: () => ({ toArray: async () => [LEGACY_INDEX] }),
    dropIndex: async (name: string) => {
      writes.push(`drop:${name}`);
    },
    createIndex: async (
      keys: Record<string, number>,
      options: { name: string; unique: boolean; partialFilterExpression: unknown },
    ) => {
      writes.push(`create:${JSON.stringify({ keys, options })}`);
      return options.name;
    },
  };

  const result = await runPublishedArticleIndexMigration(collection, 'apply');

  assert.equal(result, 'replaced');
  assert.equal(writes[0], 'drop:cafeId_1_articleId_1');
  assert.match(writes[1] ?? '', /partialFilterExpression/);
});

test('index migration apply skips an existing partial unique index', async () => {
  const writes: string[] = [];
  const collection = {
    listIndexes: () => ({ toArray: async () => [PARTIAL_INDEX] }),
    dropIndex: async () => {
      writes.push('drop');
    },
    createIndex: async () => {
      writes.push('create');
      return 'cafeId_1_articleId_1';
    },
  };

  const result = await runPublishedArticleIndexMigration(collection, 'apply');

  assert.equal(result, 'skip');
  assert.deepEqual(writes, []);
});
