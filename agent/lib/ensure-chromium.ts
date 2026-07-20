import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { chromium } from 'playwright';

/**
 * 이용자 로컬 에이전트 첫 실행 시 rebrowser-playwright 크롬을 자동 설치한다.
 * ("쓰기 전에 브라우저 구성요소를 받아 달라" 흐름을 자동화한 것.)
 *
 * 설치 경로는 PLAYWRIGHT_BROWSERS_PATH 로 정한다. 이 값은 playwright 를 import 하기
 * 전에(프로세스 진입점에서) 먼저 세팅되어 있어야 executablePath 계산과 실제 실행이
 * 같은 경로를 바라본다.
 */
export interface EnsureChromiumOptions {
  onProgress?: (line: string) => void;
}

export interface PlaywrightInstallCommand {
  executable: string;
  args: string[];
  env: NodeJS.ProcessEnv;
}

export const buildPlaywrightInstallCommand = (
  env: NodeJS.ProcessEnv = process.env,
  executable: string = process.execPath,
): PlaywrightInstallCommand => {
  // rebrowser-playwright는 cli.js를 package exports에 공개하지 않는다. package.json만
  // 공식 export로 해석한 뒤 같은 패키지 디렉터리의 CLI 엔트리를 직접 조합한다.
  const packagePath = require.resolve('playwright/package.json');
  const cliPath = join(dirname(packagePath), 'cli.js');

  return {
    executable,
    args: [cliPath, 'install', 'chromium'],
    // 패키징 앱의 process.execPath는 node가 아니라 Electron 바이너리다. 자식
    // 프로세스만 Node 모드로 실행해야 CLI가 새 Electron 창 대신 설치 명령을 수행한다.
    env: { ...env, ELECTRON_RUN_AS_NODE: '1' },
  };
};

export const getChromiumPath = (): string | null => {
  try {
    const executablePath = chromium.executablePath();
    return existsSync(executablePath) ? executablePath : null;
  } catch {
    return null;
  }
};

export const ensureChromium = async (options: EnsureChromiumOptions = {}): Promise<string> => {
  const { onProgress } = options;

  const existing = getChromiumPath();
  if (existing) {
    onProgress?.('브라우저 구성요소 확인됨');
    return existing;
  }

  onProgress?.('브라우저 구성요소 다운로드 중... (최초 1회, 수백 MB)');

  const command = buildPlaywrightInstallCommand();

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command.executable, command.args, {
      env: command.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout?.on('data', (chunk) => onProgress?.(String(chunk).trim()));
    child.stderr?.on('data', (chunk) => onProgress?.(String(chunk).trim()));
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`playwright install 실패 (exit ${code})`)),
    );
  });

  const installed = getChromiumPath();
  if (!installed) {
    throw new Error('크롬 설치 후에도 실행 파일을 찾지 못했습니다');
  }

  onProgress?.('브라우저 구성요소 준비 완료');
  return installed;
};
