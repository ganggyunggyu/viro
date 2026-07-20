import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

const INDEX_NAME = 'cafeId_1_articleId_1';
const INDEX_KEYS = { cafeId: 1, articleId: 1 } as const;
const PARTIAL_FILTER = { articleId: { $type: 'number' } } as const;

export interface PublishedArticleIndexInfo {
  name?: string;
  key?: Record<string, unknown>;
  unique?: boolean;
  partialFilterExpression?: {
    articleId?: { $type?: string };
  };
}

export interface PublishedArticleIndexCollection {
  listIndexes: () => { toArray: () => Promise<PublishedArticleIndexInfo[]> };
  dropIndex: (name: string) => Promise<unknown>;
  createIndex: (
    keys: Record<string, 1>,
    options: {
      name: string;
      unique: boolean;
      partialFilterExpression: typeof PARTIAL_FILTER;
    },
  ) => Promise<string>;
}

export type IndexMigrationMode = 'check' | 'apply';
export type IndexMigrationPlan = 'skip' | 'create' | 'replace';
export type IndexMigrationResult = IndexMigrationPlan | 'created' | 'replaced';

const isTargetPartialIndex = ({
  key,
  unique,
  partialFilterExpression,
}: PublishedArticleIndexInfo): boolean =>
  key?.cafeId === 1
  && key?.articleId === 1
  && unique === true
  && partialFilterExpression?.articleId?.$type === 'number';

export const planPublishedArticleIndexMigration = (
  indexes: PublishedArticleIndexInfo[],
): IndexMigrationPlan => {
  const existingIndex = indexes.find(({ name }) => name === INDEX_NAME);
  if (!existingIndex) {
    return 'create';
  }
  return isTargetPartialIndex(existingIndex) ? 'skip' : 'replace';
};

export const runPublishedArticleIndexMigration = async (
  collection: PublishedArticleIndexCollection,
  mode: IndexMigrationMode,
): Promise<IndexMigrationResult> => {
  const indexes = await collection.listIndexes().toArray();
  const plan = planPublishedArticleIndexMigration(indexes);

  if (mode === 'check' || plan === 'skip') {
    return plan;
  }

  if (plan === 'replace') {
    await collection.dropIndex(INDEX_NAME);
  }

  await collection.createIndex(INDEX_KEYS, {
    name: INDEX_NAME,
    unique: true,
    partialFilterExpression: PARTIAL_FILTER,
  });
  return plan === 'replace' ? 'replaced' : 'created';
};

const parseMode = (args: string[]): IndexMigrationMode => {
  const hasCheck = args.includes('--check');
  const hasApply = args.includes('--apply');
  if (hasCheck === hasApply) {
    throw new Error('--check 또는 --apply 중 하나만 지정해야 합니다.');
  }
  return hasApply ? 'apply' : 'check';
};

const main = async (): Promise<void> => {
  const mode = parseMode(process.argv.slice(2));
  dotenv.config({ path: resolve(process.cwd(), '.env.local'), quiet: true });
  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) {
    throw new Error('.env.local의 MONGODB_URI가 필요합니다.');
  }

  const connection = await mongoose.createConnection(MONGODB_URI, {
    autoIndex: false,
  }).asPromise();

  try {
    const collection = connection.collection(
      'publishedarticles',
    ) as unknown as PublishedArticleIndexCollection;
    const result = await runPublishedArticleIndexMigration(collection, mode);
    console.log(`[PUBLISHED-ARTICLE-INDEX] ${mode}: ${result}`);
  } finally {
    await connection.close();
  }
};

const SCRIPT_PATH = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PUBLISHED-ARTICLE-INDEX] 실패: ${message}`);
    process.exitCode = 1;
  });
}
