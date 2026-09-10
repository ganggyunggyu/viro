import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const scope = globalThis as typeof globalThis & { __commentWriteHarness?: { page: unknown; released: number; loginSuccess: boolean } };
const fixtures: Record<string, string> = {
  '@/shared/lib/multi-session': `const state=()=>globalThis.__commentWriteHarness; export const getPageForAccount=async()=>state().page; export const loginAccount=async()=>({success:state().loginSuccess,error:'로그인 실패'}); export const acquireAccountLock=async()=>{}; export const releaseAccountLock=()=>{state().released++}; export const saveCookiesForAccount=async()=>{}; export const invalidateLoginCache=()=>{}; export const touchAccount=()=>{}; export const isLoginRedirect=()=>false;`,
  '@/shared/lib/debug-capture': 'export const captureFailureShot=async()=>{};',
  '@/shared/models/daily-activity': 'export const incrementActivity=async()=>{};',
  '@ganggyunggyu/shared': 'export const normalizeText=value=>String(value||"").replace(/\\s+/g," ").trim();',
};

test('actual strict writer marks post-click popup uncertain and never clicks twice', async () => {
  const home = await mkdtemp(join(tmpdir(), 'viro-comment-contract-'));
  let clicks = 0;
  const page = {
    goto: async () => {}, url: () => 'https://cafe.naver.com/ca-fe/cafes/1/articles/20',
    waitForTimeout: async () => {},
    waitForSelector: async () => { throw new Error('No frame'); },
    $eval: async () => '댓글 작성자', $$: async () => [],
    $: async (selector: string) => {
      if (selector.includes('textarea.comment_inbox_text')) return { click: async () => {}, fill: async () => {} };
      if (selector.includes('a.btn_register')) return { click: async () => { clicks++; } };
      if (selector.includes('.LayerPopup') && clicks) return { textContent: async () => '처리 결과를 확인할 수 없습니다' };
      return null;
    },
  };
  scope.__commentWriteHarness = { page, released: 0, loginSuccess: true };
  try {
    const output = join(home, 'writer.cjs');
    await build({ entryPoints: [join(process.cwd(), 'src/shared/lib/naver-cafe-writing/comment-writer.ts')], outfile: output, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent', plugins: [{ name: 'comment-test-boundaries', setup: (builder) => {
      builder.onResolve({ filter: /.*/ }, ({ path }) => fixtures[path] ? { path, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: fixtures[path], loader: 'js' }));
    } }] });
    const { writeCommentWithAccount } = createRequire(import.meta.url)(output) as { writeCommentWithAccount: (account: unknown, cafeId: string, articleId: number, content: string, options: unknown) => Promise<{ success: boolean; requiresReview?: boolean }> };
    const result = await writeCommentWithAccount({ id: 'fixture', password: 'fixture-secret' }, '1', 20, '테스트', { ensureLogin: true, strictVerification: true });
    assert.equal(clicks, 1);
    assert.equal(result.success, false);
    assert.equal(result.requiresReview, true);
    assert.equal(scope.__commentWriteHarness.released, 1);
    scope.__commentWriteHarness.loginSuccess = false;
    const beforeSubmit = await writeCommentWithAccount({ id: 'fixture', password: 'fixture-secret' }, '1', 20, '테스트', { ensureLogin: true, strictVerification: true });
    assert.equal(beforeSubmit.requiresReview, undefined);
    assert.equal(clicks, 1);
  } finally {
    delete scope.__commentWriteHarness;
    await rm(home, { recursive: true, force: true });
  }
});
