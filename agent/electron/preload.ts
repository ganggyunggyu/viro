import { contextBridge, ipcRenderer } from 'electron';

/**
 * 렌더러(설정 화면)에 노출하는 안전한 브리지. 렌더러는 nodeIntegration 없이 이 API로만
 * 메인 프로세스와 통신한다.
 */
const desktopApi = {
  isDesktop: true,
  getConfig: () => ipcRenderer.invoke('get-config'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  getContext: () => ipcRenderer.invoke('get-desktop-context'),
  prepare: (operation: string, payload: Record<string, unknown>) =>
    ipcRenderer.invoke('prepare-desktop-operation', operation, payload),
  saveConfig: (config: { brokerUrl: string; token: string }) =>
    ipcRenderer.invoke('save-config', config),
  ensureChromium: () => ipcRenderer.invoke('ensure-chromium'),
  startAgent: () => ipcRenderer.invoke('start-agent'),
  stopAgent: () => ipcRenderer.invoke('stop-agent'),
  executeAction: (action: unknown) => ipcRenderer.invoke('execute-browser-action', action),
  onLog: (callback: (line: string) => void) =>
    ipcRenderer.on('agent-log', (_event, line: string) => callback(line)),
  onSetupProgress: (callback: (line: string) => void) =>
    ipcRenderer.on('setup-progress', (_event, line: string) => callback(line)),
  onStatus: (callback: (status: { running: boolean }) => void) =>
    ipcRenderer.on('agent-status', (_event, status: { running: boolean }) => callback(status)),
};

contextBridge.exposeInMainWorld('viroDesktop', desktopApi);
// 오프라인 폴백 화면과 이전 빌드 호환용 별칭.
contextBridge.exposeInMainWorld('viroAgent', desktopApi);
