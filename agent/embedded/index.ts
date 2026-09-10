import type { EmbeddedWorker, EmbeddedWorkerCallbacks, EmbeddedWorkerConfig } from './types';
import { createEmbeddedClient } from './client';
import { createWorkerRuntime } from './runtime';
import { EmbeddedWorkerError } from './errors';
export type { EmbeddedWorker, EmbeddedWorkerCallbacks, EmbeddedWorkerConfig, EmbeddedExecution, EmbeddedTaskKind, WorkerReadiness } from './types';

/** Instantiate only in Ply's isolated owner-specific child process. No I/O during import. */
export const createEmbeddedWorker = (config: EmbeddedWorkerConfig, callbacks: EmbeddedWorkerCallbacks = {}): EmbeddedWorker => {
  if (!config.browsersPath || !Number.isFinite(config.pollIntervalMs) || config.pollIntervalMs <= 0) throw new EmbeddedWorkerError('browser_prepare_failed');
  const client = createEmbeddedClient(config);
  let browser: typeof import('./browser-runtime') | undefined;
  return createWorkerRuntime(config, callbacks, {
    handshake: client.handshake,
    prepareBrowser: async () => {
      process.env.PLAYWRIGHT_BROWSERS_PATH = config.browsersPath;
      process.env.DEBUG_CAPTURE = 'false';
      browser ??= await import('./browser-runtime');
      await browser.prepareBrowser();
    },
    heartbeat: async (operationId, taskId) => {
      const alive = await Promise.all([client.operationHeartbeat(operationId), client.actionHeartbeat(taskId)]);
      if (alive.some((value) => !value)) throw new EmbeddedWorkerError('broker_unavailable');
    },
    run: async (kind, id, ownsLease, onClaimed) => {
      if (!browser) throw new EmbeddedWorkerError('execution_uncertain');
      return browser.runBrowserTask(kind, id, ownsLease, client, onClaimed);
    },
    closeBrowser: async () => { await browser?.closeBrowser(); },
  });
};
export { createSchedulerWorker } from './scheduler-worker';
export type { SchedulerWorkerConfig } from './types';
