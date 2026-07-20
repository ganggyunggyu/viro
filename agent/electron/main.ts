import { app, BrowserWindow, ipcMain } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Viro 프로그램(데스크톱 앱) 메인 프로세스.
 * 렌더러(설정 화면)에서 브로커 주소 + 연결 토큰을 받아 저장하고, 첫 실행 시 크롬을
 * 자동 설치한 뒤 에이전트 루프를 이 프로세스에서 돌린다. 로그는 렌더러로 전달한다.
 */

const AGENT_HOME = join(homedir(), '.viro-agent');
const CONFIG_PATH = join(AGENT_HOME, 'config.json');
const BROWSERS_PATH = join(AGENT_HOME, 'browsers');

interface StoredConfig {
  brokerUrl: string;
  token: string;
}

const loadStored = (): StoredConfig => {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as StoredConfig;
  } catch {
    return { brokerUrl: 'https://cafe-bot-two.vercel.app', token: '' };
  }
};

const saveStored = (config: StoredConfig): void => {
  if (!existsSync(AGENT_HOME)) {
    mkdirSync(AGENT_HOME, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
};

let mainWindow: BrowserWindow | null = null;
let agentRunning = false;
let stopRequested = false;

const send = (channel: string, payload: unknown): void => {
  mainWindow?.webContents.send(channel, payload);
};

// 에이전트 루프는 console.log 로 진행 상황을 낸다. 렌더러 로그 패널로도 흘려보낸다.
const originalLog = console.log.bind(console);
const originalError = console.error.bind(console);
console.log = (...args: unknown[]) => {
  originalLog(...args);
  send('agent-log', args.map(String).join(' '));
};
console.error = (...args: unknown[]) => {
  originalError(...args);
  send('agent-log', args.map(String).join(' '));
};

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 680,
    height: 760,
    title: 'Viro',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(join(__dirname, 'renderer.html'));
};

app.whenReady().then(() => {
  process.env.PLAYWRIGHT_BROWSERS_PATH = BROWSERS_PATH;
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-config', () => loadStored());

ipcMain.handle('save-config', (_event, config: StoredConfig) => {
  saveStored(config);
  return true;
});

ipcMain.handle('ensure-chromium', async () => {
  const { ensureChromium } = await import('../lib/ensure-chromium');
  await ensureChromium({ onProgress: (line) => send('setup-progress', line) });
  return true;
});

ipcMain.handle('start-agent', async () => {
  if (agentRunning) {
    return false;
  }

  const stored = loadStored();
  if (!stored.brokerUrl || !stored.token) {
    send('agent-log', '[앱] 브로커 주소와 연결 토큰을 먼저 저장하세요');
    return false;
  }

  process.env.BROKER_URL = stored.brokerUrl;
  process.env.AGENT_TOKEN = stored.token;
  process.env.PLAYWRIGHT_BROWSERS_PATH = BROWSERS_PATH;

  const { loadAgentConfig } = await import('../lib/config');
  const { ensureChromium } = await import('../lib/ensure-chromium');
  const { runAgentLoop } = await import('../runtime');

  agentRunning = true;
  stopRequested = false;
  send('agent-status', { running: true });

  (async () => {
    try {
      await ensureChromium({ onProgress: (line) => send('setup-progress', line) });
      await runAgentLoop(loadAgentConfig(), {
        shouldStop: () => stopRequested,
        handleSignals: false,
      });
    } catch (error) {
      send('agent-log', `[앱] 오류: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      agentRunning = false;
      send('agent-status', { running: false });
    }
  })();

  return true;
});

ipcMain.handle('stop-agent', () => {
  stopRequested = true;
  send('agent-log', '[앱] 정지 요청 - 현재 작업 마무리 후 멈춥니다');
  return true;
});
