import { build } from 'esbuild';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { isBuiltin } from 'node:module';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'agent/embedded');
const output = join(source, 'out');
const packageDir = join(output, 'package');
await mkdir(packageDir, { recursive: true });
const result = await build({
  entryPoints: [join(source, 'index.ts')], outfile: join(packageDir, 'index.cjs'),
  bundle: true, platform: 'node', format: 'cjs', target: 'node22',
  tsconfig: join(root, 'tsconfig.json'), external: ['playwright', 'playwright/*', 'mongoose', 'next', 'next/*', '@google/genai', '@opentelemetry/*'],
  metafile: true, minify: true, drop: ['console'], legalComments: 'none',
  plugins: [{ name: 'browser-only-model-boundary', setup(build) {
    build.onResolve({ filter: /(?:^@\/shared\/models|models\/)/ }, async (args) => {
      if (args.pluginData?.resolved) return;
      const resolved = await build.resolve(args.path, { importer: args.importer, resolveDir: args.resolveDir, kind: args.kind, pluginData: { resolved: true } });
      if (resolved.path.endsWith('/src/shared/models/daily-activity.ts')) return { path: join(source, 'activity.ts') };
      if (/\/src\/shared\/models\/(?:account|cafe)\.ts$/.test(resolved.path)) return { path: join(source, 'server-model-boundary.ts') };
      if (resolved.path.includes('/src/shared/models/')) return { path: resolved.path, sideEffects: false };
      return resolved;
    });
  } }],
});
const externals = [...new Set(Object.values(result.metafile.outputs).flatMap(({ imports }) => imports.filter(({ external }) => external).map(({ path }) => path)))];
const forbidden = externals.filter((name) => !isBuiltin(name) && name !== 'playwright' && name !== 'playwright/package.json');
if (forbidden.length) throw new Error(`Unexpected runtime dependency: ${forbidden.join(', ')}`);
await copyFile(join(source, 'package.json'), join(packageDir, 'package.json'));
await copyFile(join(source, 'README.md'), join(packageDir, 'README.md'));
await copyFile(join(source, 'types.ts'), join(packageDir, 'types.d.ts'));
await writeFile(join(packageDir, 'index.d.ts'), "import type { EmbeddedWorker, EmbeddedWorkerCallbacks, EmbeddedWorkerConfig, SchedulerWorkerConfig } from './types';\nexport * from './types';\nexport declare const createEmbeddedWorker: (config: EmbeddedWorkerConfig, callbacks?: EmbeddedWorkerCallbacks) => EmbeddedWorker;\nexport declare const createSchedulerWorker: (config: SchedulerWorkerConfig, callbacks?: EmbeddedWorkerCallbacks) => EmbeddedWorker;\n");
const packed = spawnSync('npm', ['pack', packageDir, '--pack-destination', output, '--ignore-scripts', '--json'], { cwd: root, encoding: 'utf8' });
if (packed.status !== 0) throw new Error('Embedded worker packaging failed');
const [{ filename }] = JSON.parse(packed.stdout);
await writeFile(join(output, 'build-manifest.json'), JSON.stringify({ filename, externals }, null, 2) + '\n');
console.log(join(output, filename));
