import { loadAgentConfig } from './lib/config';

/**
 * Viro 로컬 에이전트 CLI 진입점.
 * 사용법: BROKER_URL=... AGENT_TOKEN=... tsx agent/cli.ts
 *
 * PLAYWRIGHT_BROWSERS_PATH 는 playwright 를 로드하는 모듈(ensure-chromium/runtime)을
 * import 하기 전에 세팅되어야 설치 경로와 실행 경로가 일치한다. 그래서 설정을 먼저 읽어
 * env 를 세팅한 뒤 동적 import 한다.
 */
const main = async (): Promise<void> => {
  const config = loadAgentConfig();

  process.env.PLAYWRIGHT_BROWSERS_PATH = config.browsersPath;
  console.log(`[AGENT] 브라우저 경로: ${config.browsersPath}`);

  const { ensureChromium } = await import('./lib/ensure-chromium');
  await ensureChromium({ onProgress: (line) => console.log('[SETUP]', line) });

  const { runAgentLoop } = await import('./runtime');
  await runAgentLoop(config);
};

main().catch((error) => {
  console.error('[AGENT] 치명적 오류:', error instanceof Error ? error.message : error);
  process.exit(1);
});
