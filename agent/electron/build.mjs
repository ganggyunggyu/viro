import { build } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Electron main/preload 를 단일 CJS 번들로 컴파일한다. runtime 이 ../src 프리미티브를
 * @/ 별칭으로 타고 들어가므로 tsconfig paths 로 해소하고, 런타임에만 필요한 네이티브/무거운
 * 패키지는 external 로 남겨 패키지의 node_modules 에서 로드한다.
 */
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const outdir = join(here, 'dist');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const rendererTemplate = readFileSync(join(here, 'renderer.html'), 'utf8');

if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(version)) {
  throw new Error('[build] package.json version 값이 올바르지 않습니다');
}
if (!rendererTemplate.includes('__VIRO_VERSION__')) {
  throw new Error('[build] renderer.html 버전 표시 위치가 없습니다');
}

mkdirSync(outdir, { recursive: true });

const external = [
  'electron',
  'playwright',
  'mongoose',
  '@google/genai',
  'next',
  'sharp',
  '@opentelemetry/*',
  '@anthropic-ai/*',
];

await build({
  entryPoints: [join(here, 'main.ts'), join(here, 'preload.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  tsconfig: join(root, 'tsconfig.json'),
  external,
  outdir,
  logLevel: 'info',
});

await build({
  entryPoints: [join(here, 'renderer.ts')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'chrome120',
  tsconfig: join(root, 'tsconfig.json'),
  outfile: join(outdir, 'renderer.js'),
  logLevel: 'info',
});

writeFileSync(join(outdir, 'renderer.html'), rendererTemplate.replaceAll('__VIRO_VERSION__', version));
copyFileSync(join(here, 'renderer.css'), join(outdir, 'renderer.css'));

console.log('[build] agent/electron/dist 생성 완료');
