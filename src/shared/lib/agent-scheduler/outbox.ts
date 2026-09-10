import { randomBytes } from 'node:crypto';

export interface SchedulerDispatchFields {
  executionTarget: 'scheduler';
  dispatchId: string;
  dispatchState: 'pending' | 'delivered';
  dispatchAttempts: number;
  deliveredAt?: Date;
}
export interface SchedulerOutboxDocument extends Partial<SchedulerDispatchFields> {
  _id: unknown;
  userId: string;
  status: string;
  createdAt: Date;
}
export type SchedulerTaskKind = 'operation' | 'action';
export interface SchedulerTask { kind: SchedulerTaskKind; id: string; dispatchId: string }
export interface SchedulerOutboxDependencies {
  url?: string;
  secret?: string;
  fetch: typeof fetch;
  signRequest: (secret: string, method: string, pathname: string, body: string) => Record<string, string>;
  beginAttempt: (task: SchedulerTask) => Promise<boolean>;
  markDelivered: (task: SchedulerTask, at: Date) => Promise<boolean>;
  findPending: (limit: number) => Promise<{ kind: SchedulerTaskKind; doc: SchedulerOutboxDocument }[]>;
  expireStale: () => Promise<void>;
}

export const createSchedulerDispatch = (): SchedulerDispatchFields => ({
  executionTarget: 'scheduler', dispatchId: randomBytes(32).toString('hex'), dispatchState: 'pending', dispatchAttempts: 0,
});

const destination = (raw?: string): URL | null => {
  try {
    if (!raw) return null;
    const url = new URL(raw);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) return null;
    return new URL('/viro/tasks', url);
  } catch { return null; }
};

export const hasSchedulerDispatchConfig = (url?: string, secret?: string): boolean =>
  Boolean(destination(url) && secret && Buffer.byteLength(secret, 'utf8') >= 32);

const taskFor = (kind: SchedulerTaskKind, doc: SchedulerOutboxDocument): SchedulerTask | null => {
  const { _id, executionTarget, status, dispatchId, dispatchState } = doc;
  const id = String(_id);
  if (executionTarget !== 'scheduler' || status !== 'pending' || dispatchState !== 'pending') return null;
  if (!dispatchId || !/^[a-f0-9]{64}$/.test(dispatchId)) return null;
  if (!(kind === 'operation' ? /^[a-f0-9]{24}$/ : /^[a-f0-9]{64}$/).test(id)) return null;
  return { kind, id, dispatchId };
};

export const createSchedulerOutbox = (deps: SchedulerOutboxDependencies) => {
  const dispatch = async (kind: SchedulerTaskKind, doc: SchedulerOutboxDocument): Promise<boolean> => {
    try {
      const task = taskFor(kind, doc);
      const url = destination(deps.url);
      const { secret } = deps;
      if (!task || !url || !secret || Buffer.byteLength(secret, 'utf8') < 32) return false;
      if (!await deps.beginAttempt(task)) return false;
      const body = JSON.stringify(task);
      const headers = { 'content-type': 'application/json', ...deps.signRequest(secret, 'POST', url.pathname, body) };
      const response = await deps.fetch(url, { method: 'POST', headers, body, redirect: 'error', signal: AbortSignal.timeout(10_000) });
      if (response.status !== 202) return false;
      return await deps.markDelivered(task, new Date());
    } catch { return false; }
  };
  const recover = async (limit = 50): Promise<{ examined: number; delivered: number }> => {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new RangeError('limit must be 1–100');
    await deps.expireStale();
    const rows = (await deps.findPending(limit)).slice(0, limit);
    const deliveries = await Promise.all(rows.map(({ kind, doc }) => dispatch(kind, doc)));
    return { examined: rows.length, delivered: deliveries.filter(Boolean).length };
  };
  return { dispatch, recover };
};
