import { spawn } from 'child_process';
import { existsSync } from 'fs';
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

  // npx 없이 번들 환경에서도 동작하도록 rebrowser-playwright 의 cli.js 를 직접 실행한다.
  const cliPath = require.resolve('playwright/cli.js');

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, 'install', 'chromium'], {
      env: { ...process.env },
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
