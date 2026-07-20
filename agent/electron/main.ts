import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Viro 프로그램(데스크톱 앱) 메인 프로세스.
 * 번들된 로컬 화면에서 브로커 주소 + 연결 토큰을 받아 저장하고, 첫 실행 시 크롬을
 * 자동 설치한 뒤 작업과 에이전트 루프를 이 프로세스에서 돌린다.
 */

const AGENT_HOME = process.env.VIRO_AGENT_HOME || join(homedir(), '.viro-agent');
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
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: 'Viro',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });
  void mainWindow.loadFile(join(__dirname, 'renderer.html'));
};

const createStoredBroker = async () => {
  const stored = loadStored();
  if (!stored.brokerUrl || !stored.token) {
    throw new Error('연결 설정에서 서버 주소와 토큰을 먼저 저장하세요');
  }
  process.env.BROKER_URL = stored.brokerUrl;
  process.env.AGENT_TOKEN = stored.token;
  process.env.PLAYWRIGHT_BROWSERS_PATH = BROWSERS_PATH;
  const [{ loadAgentConfig }, { createBrokerClient }] = await Promise.all([
    import('../lib/config'),
    import('../lib/broker-client'),
  ]);
  return createBrokerClient(loadAgentConfig());
};

const getDesktopContext = async (): Promise<unknown> => {
  const broker = await createStoredBroker();
  const { accounts, cafes } = await broker.context();
  return {
    accounts: accounts.map(({ accountId, nickname, isMain, role }) => ({
      accountId,
      nickname,
      isMain,
      role,
    })),
    cafes,
  };
};

const prepareDesktopOperation = async (
  operation: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const broker = await createStoredBroker();
  return broker.prepare(operation, payload);
};

const startAgent = async (): Promise<boolean> => {
  if (agentRunning) {
    return false;
  }

  const stored = loadStored();
  if (!stored.brokerUrl || !stored.token) {
    send('agent-log', '[앱] 서버 주소와 연결 토큰을 먼저 저장하세요');
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

  void (async () => {
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
};

const executeBrowserAction = async (action: unknown): Promise<unknown> => {
  const stored = loadStored();
  if (!stored.brokerUrl || !stored.token) {
    return { success: false, error: '프로그램 메뉴에서 연결 토큰을 먼저 발급하세요' };
  }

  process.env.BROKER_URL = stored.brokerUrl;
  process.env.AGENT_TOKEN = stored.token;
  process.env.PLAYWRIGHT_BROWSERS_PATH = BROWSERS_PATH;

  try {
    const { ensureChromium } = await import('../lib/ensure-chromium');
    const { loadAgentConfig } = await import('../lib/config');
    const { createBrokerClient } = await import('../lib/broker-client');
    const { executeDesktopAction } = await import('../desktop-actions');
    await ensureChromium({ onProgress: (line) => send('setup-progress', line) });
    return executeDesktopAction(action, createBrokerClient(loadAgentConfig()));
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '로컬 실행 실패',
    };
  }
};

app.whenReady().then(() => {
  process.env.PLAYWRIGHT_BROWSERS_PATH = BROWSERS_PATH;
  createWindow();
  if (loadStored().token) {
    void startAgent();
  }

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
ipcMain.handle('get-status', () => ({ running: agentRunning }));
ipcMain.handle('get-desktop-context', getDesktopContext);
ipcMain.handle(
  'prepare-desktop-operation',
  (_event, operation: string, payload: Record<string, unknown>) =>
    prepareDesktopOperation(operation, payload),
);

ipcMain.handle('save-config', (_event, config: StoredConfig) => {
  saveStored(config);
  return true;
});

ipcMain.handle('ensure-chromium', async () => {
  const { ensureChromium } = await import('../lib/ensure-chromium');
  await ensureChromium({ onProgress: (line) => send('setup-progress', line) });
  return true;
});

ipcMain.handle('start-agent', startAgent);

ipcMain.handle('stop-agent', () => {
  stopRequested = true;
  send('agent-log', '[앱] 정지 요청 - 현재 작업 마무리 후 멈춥니다');
  return true;
});

ipcMain.handle('execute-browser-action', (_event, action: unknown) =>
  executeBrowserAction(action));
