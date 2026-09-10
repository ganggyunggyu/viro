import { ensureChromium, verifyChromiumLaunches } from '../lib/ensure-chromium';
import { closeAllContexts } from '../../src/shared/lib/multi-session';
import { withCaptchaSolver } from '../../src/shared/lib/captcha-client';
import { withBrowserExecutionGuard } from '../../src/shared/lib/browser-execution-guard';
import { executeAgentOperation } from '../operation-executor';
import { executeDesktopAction } from '../desktop-actions';
import { executeRequestedTask } from './execution';
import type { EmbeddedClient } from './client';
import type { EmbeddedTaskKind } from './types';
import { EmbeddedWorkerError } from './errors';

export const prepareBrowser = async (): Promise<void> => {
  await ensureChromium();
  if (!await verifyChromiumLaunches()) throw new EmbeddedWorkerError('browser_prepare_failed');
};
export const runBrowserTask = (kind: EmbeddedTaskKind, id: string, ownsLease: () => boolean, client: EmbeddedClient, onClaimed: () => void) =>
  withBrowserExecutionGuard(ownsLease, () => withCaptchaSolver(client.solveCaptcha, () =>
    executeRequestedTask(kind, id, ownsLease, { client, operation: executeAgentOperation, action: executeDesktopAction }, onClaimed)));

export const closeBrowser = async (): Promise<void> => {
  const global = globalThis as typeof globalThis & { __pwBrowserLaunching?: Promise<unknown> | null; __pwIdleTimer?: ReturnType<typeof setInterval> | null };
  await global.__pwBrowserLaunching?.catch(() => {});
  try { await closeAllContexts(); }
  finally {
    if (global.__pwIdleTimer) clearInterval(global.__pwIdleTimer);
    global.__pwIdleTimer = null;
  }
};
