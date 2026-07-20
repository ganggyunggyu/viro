import { contextBridge, ipcRenderer } from 'electron';

/**
 * 렌더러(설정 화면)에 노출하는 안전한 브리지. 렌더러는 nodeIntegration 없이 이 API로만
 * 메인 프로세스와 통신한다.
 */
contextBridge.exposeInMainWorld('viroAgent', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: { brokerUrl: string; token: string }) =>
    ipcRenderer.invoke('save-config', config),
  ensureChromium: () => ipcRenderer.invoke('ensure-chromium'),
  startAgent: () => ipcRenderer.invoke('start-agent'),
  stopAgent: () => ipcRenderer.invoke('stop-agent'),
  onLog: (callback: (line: string) => void) =>
    ipcRenderer.on('agent-log', (_event, line: string) => callback(line)),
  onSetupProgress: (callback: (line: string) => void) =>
    ipcRenderer.on('setup-progress', (_event, line: string) => callback(line)),
  onStatus: (callback: (status: { running: boolean }) => void) =>
    ipcRenderer.on('agent-status', (_event, status: { running: boolean }) => callback(status)),
});
