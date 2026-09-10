import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { TestContext } from 'node:test';
import { build } from 'esbuild';

interface CafeFixtureState {
  userId: string | null;
  filters: unknown[];
  creates: number;
}
const require = createRequire(import.meta.url);
const fixtures: Record<string, string> = {
  'cafe-state': 'export const state = { userId: null, filters: [], creates: 0 };',
  'next/cache': 'export const revalidatePath = () => {};',
  '@/shared/lib/mongodb': 'export const connectDB = async () => {};',
  '@/shared/config/user': `import { state } from 'cafe-state';
    export const getCurrentUserId = async () => { if (!state.userId) throw new Error('로그인이 필요합니다'); return state.userId; };`,
  '@/shared/models/account': `import { state } from 'cafe-state'; export const Account = {
    findOne: filter => { state.filters.push(filter); return { lean: async () => null }; }
  };`,
  '@/shared/lib/naver-cafe-creation': `import { state } from 'cafe-state';
    export const CAFE_TOPIC_PRESETS = [{ key: 'fixture', keywords: [] }];
    export const getAvailableOwnerAccounts = async () => [];
    export const registerCreatedCafeInDb = async () => { throw new Error('write forbidden'); };
    export const createNaverCafe = async () => { state.creates++; throw new Error('browser forbidden'); };`,
  '@/shared/lib/naver-cafe-creation/sheet-sync': 'export const syncCafeToOperationsSheet = async () => { throw new Error("sheet forbidden"); };',
};

export const loadCafeAction = async (context: TestContext) => {
  await mkdir(join(process.cwd(), 'work'), { recursive: true });
  const temporary = await mkdtemp(join(process.cwd(), 'work/cafe-auth-test-'));
  context.after(async () => { await rm(temporary, { recursive: true, force: true }); });
  const output = join(temporary, 'action.cjs');
  await build({
    stdin: { contents: "export { createCafeAction } from '@/features/auto-comment/batch/cafe-create-actions'; export { state } from 'cafe-state';", resolveDir: process.cwd() },
    outfile: output, bundle: true, platform: 'node', format: 'cjs', packages: 'external',
    plugins: [{ name: 'cafe-auth-boundary', setup: (builder) => {
      builder.onResolve({ filter: /.*/ }, ({ path }) => fixtures[path] ? { path, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: fixtures[path], loader: 'js' }));
    } }],
  });
  return require(output) as { state: CafeFixtureState; createCafeAction: (input: unknown) => Promise<{ success: boolean }> };
};
