import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

export interface ExternalArticleStubCandidate {
  _id: unknown;
  writerAccountId?: string;
  title?: string;
  menuId?: string;
  keyword?: string;
  content?: string;
  isExternal?: boolean;
}

export interface ExternalArticleStubCollection {
  find: (
    filter: Record<string, unknown>,
    options: { projection: Record<string, 0 | 1> },
  ) => { toArray: () => Promise<ExternalArticleStubCandidate[]> };
  updateMany: (
    filter: Record<string, unknown>,
    update: { $set: { isExternal: true } },
  ) => Promise<{ modifiedCount: number }>;
}

export type ExternalArticleStubBackfillMode = 'dry-run' | 'apply';

export const isExternalArticleStub = ({
  writerAccountId,
  title,
  menuId,
  keyword,
  content,
  isExternal,
}: ExternalArticleStubCandidate): boolean => {
  if (isExternal === true) {
    return false;
  }

  return writerAccountId === '' || (
    title === '외부 글'
    && menuId === ''
    && keyword === ''
    && content === ''
  );
};

export const selectExternalArticleStubs = (
  records: ExternalArticleStubCandidate[],
): ExternalArticleStubCandidate[] => records.filter(isExternalArticleStub);

export const runExternalArticleStubBackfill = async (
  collection: ExternalArticleStubCollection,
  mode: ExternalArticleStubBackfillMode,
): Promise<{ matchedCount: number; modifiedCount: number }> => {
  const candidates = await collection.find(
    {
      isExternal: { $ne: true },
      $or: [
        { writerAccountId: '' },
        { title: '외부 글' },
      ],
    },
    {
      projection: {
        _id: 1,
        writerAccountId: 1,
        title: 1,
        menuId: 1,
        keyword: 1,
        content: 1,
        isExternal: 1,
      },
    },
  ).toArray();
  const targets = selectExternalArticleStubs(candidates);

  if (mode === 'dry-run' || targets.length === 0) {
    return { matchedCount: targets.length, modifiedCount: 0 };
  }

  const { modifiedCount } = await collection.updateMany(
    { _id: { $in: targets.map(({ _id }) => _id) } },
    { $set: { isExternal: true } },
  );
  return { matchedCount: targets.length, modifiedCount };
};

const parseMode = (args: string[]): ExternalArticleStubBackfillMode => {
  const hasDryRun = args.includes('--dry-run');
  const hasApply = args.includes('--apply');
  if (hasDryRun && hasApply) {
    throw new Error('--dry-run과 --apply를 동시에 지정할 수 없습니다.');
  }
  return hasApply ? 'apply' : 'dry-run';
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
    ) as unknown as ExternalArticleStubCollection;
    const { matchedCount, modifiedCount } = await runExternalArticleStubBackfill(
      collection,
      mode,
    );
    console.log(
      `[EXTERNAL-ARTICLE-STUB-BACKFILL] ${mode}: matched=${matchedCount}, modified=${modifiedCount}`,
    );
  } finally {
    await connection.close();
  }
};

const SCRIPT_PATH = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[EXTERNAL-ARTICLE-STUB-BACKFILL] 실패: ${message}`);
    process.exitCode = 1;
  });
}
