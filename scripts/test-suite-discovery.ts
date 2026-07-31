import { globSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type TestSuite = 'harness' | 'live';

const TEST_GLOBS = [
  'agent/**/*.test.ts',
  'src/**/*.test.ts',
  'scripts/**/*.test.ts',
];

const LIVE_TEST_PATTERN = /\.(?:live|integration)\.test\.ts$/;
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = resolve(dirname(SCRIPT_PATH), '..');

export const selectTestFiles = (files: string[], suite: TestSuite): string[] =>
  files
    .filter((file) => suite === 'live' ? LIVE_TEST_PATTERN.test(file) : !LIVE_TEST_PATTERN.test(file))
    .sort();

export const discoverTestFiles = (
  suite: TestSuite,
  projectRoot: string = PROJECT_ROOT,
): string[] => {
  const files = TEST_GLOBS.flatMap((pattern) => globSync(pattern, { cwd: projectRoot }));
  return selectTestFiles(files, suite);
};

const runTestSuite = (suite: TestSuite): void => {
  const files = discoverTestFiles(suite);
  if (files.length === 0) {
    console.log(`[TEST-SUITE] ${suite} 테스트 없음`);
    return;
  }

  const { status, error } = spawnSync('tsx', ['--test', ...files], {
    cwd: PROJECT_ROOT,
    env: process.env,
    stdio: 'inherit',
  });

  if (error) {
    throw error;
  }

  process.exitCode = status ?? 1;
};

const main = (): void => {
  const [suite = 'harness'] = process.argv.slice(2);
  if (suite !== 'harness' && suite !== 'live') {
    throw new Error(`지원하지 않는 테스트 스위트: ${suite}`);
  }

  runTestSuite(suite);
};

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  main();
}
