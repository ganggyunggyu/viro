import type { EmbeddedWorker, EmbeddedWorkerCallbacks, SchedulerWorkerConfig } from './types';
import { createSchedulerClient } from './scheduler-client';
import { createWorkerRuntime } from './runtime';
import { EmbeddedWorkerError } from './errors';

export const createSchedulerWorker = (config: SchedulerWorkerConfig, callbacks: EmbeddedWorkerCallbacks = {}): EmbeddedWorker => {
  if (!config.browsersPath || !Number.isFinite(config.pollIntervalMs) || config.pollIntervalMs <= 0) throw new EmbeddedWorkerError('browser_prepare_failed');
  const client = createSchedulerClient(config);
  let browser: typeof import('./browser-runtime') | undefined;
  return createWorkerRuntime({ ...config, token: '' }, callbacks, {
    handshake: client.handshake,
    prepareBrowser: async () => {
      process.env.PLAYWRIGHT_BROWSERS_PATH = config.browsersPath;
      process.env.DEBUG_CAPTURE = 'false';
      browser ??= await import('./browser-runtime');
      await browser.prepareBrowser();
    },
    heartbeat: async (operationId, taskId) => {
      const id = config.kind === 'operation' ? operationId : taskId;
      if (!await (config.kind === 'operation' ? client.operationHeartbeat(id) : client.actionHeartbeat(id))) throw new EmbeddedWorkerError('broker_unavailable');
    },
    run: async (kind, id, ownsLease, onClaimed) => {
      if (!browser || kind !== config.kind || id !== config.id) throw new EmbeddedWorkerError('execution_uncertain');
      return browser.runBrowserTask(kind, id, ownsLease, client, onClaimed);
    },
    closeBrowser: async () => { await browser?.closeBrowser(); },
  });
};
