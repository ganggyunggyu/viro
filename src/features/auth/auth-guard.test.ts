import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import { build } from 'esbuild';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

interface GuardState {
  pathname: string;
  initialized: boolean;
  loading: boolean;
  user: { id: string } | null;
  lookups: number;
  redirects: string[];
  effects: Array<() => void>;
}

const require = createRequire(import.meta.url);
const fixtures: Record<string, string> = {
  'guard-state': 'export const state = {};',
  react: `export * from ${JSON.stringify(require.resolve('react'))};
    import React from ${JSON.stringify(require.resolve('react'))}; export default React;
    import { state } from 'guard-state'; export const useEffect = effect => state.effects.push(effect);`,
  'next/navigation': `import { state } from 'guard-state'; export const usePathname = () => state.pathname;
    export const useRouter = () => ({ replace: path => state.redirects.push(path) });`,
  jotai: `import { state } from 'guard-state'; export const useAtom = key => [state[key], () => {}];`,
  '@/shared': `export const userAtom = 'user'; export const userLoadingAtom = 'loading';
    export const userInitializedAtom = 'initialized'; export const cn = value => value;`,
  './actions': `import { state } from 'guard-state';
    export const getCurrentUser = async () => { state.lookups++; return null; };`,
};

test('소개페이지 가드는 인증 초기화와 로그인 이동 없이 본문을 표시한다', async (context) => {
  await mkdir(join(process.cwd(), 'work'), { recursive: true });
  const temporary = await mkdtemp(join(process.cwd(), 'work/auth-guard-test-'));
  try {
    const output = join(temporary, 'guard.cjs');
    await build({
      stdin: { contents: "export { AuthGuard } from '@/features/auth/auth-guard'; export { state } from 'guard-state';", resolveDir: process.cwd() },
      outfile: output, bundle: true, platform: 'node', format: 'cjs', packages: 'external', external: [require.resolve('react')],
      plugins: [{ name: 'auth-boundaries', setup: (builder) => {
        builder.onResolve({ filter: /.*/ }, ({ path }) => fixtures[path] ? { path, namespace: 'fixture' } : undefined);
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: fixtures[path], loader: 'js' }));
      } }],
    });
    const { AuthGuard, state } = require(output) as { AuthGuard: ComponentType<{ children?: string }>; state: GuardState };
    const render = (pathname: string, initialized: boolean) => {
      Object.assign(state, { pathname, initialized, loading: !initialized, user: null, lookups: 0, redirects: [], effects: [] });
      const html = renderToStaticMarkup(createElement(AuthGuard, null, '소개 본문'));
      state.effects.forEach((effect) => effect());
      return html;
    };
    for (const pathname of ['/landing', '/landing/']) {
      for (const initialized of [false, true]) {
        await context.test(`${pathname}: 인증 초기화 ${initialized}`, () => {
          assert.match(render(pathname, initialized), /소개 본문/);
          assert.equal(state.lookups, 0);
          assert.deepEqual(state.redirects, []);
        });
      }
    }
    await context.test('서비스와 소개페이지 하위 경로는 인증을 유지한다', () => {
      for (const pathname of ['/manual-post', '/accounts', '/landing/admin', '/landing-secret']) {
        assert.doesNotMatch(render(pathname, true), /소개 본문/);
        assert.deepEqual(state.redirects, ['/login']);
      }
      assert.match(render('/accounts', false), /로딩 중/);
      assert.equal(state.lookups, 1);
      assert.match(render('/login', true), /소개 본문/);
      assert.deepEqual(state.redirects, []);
    });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
