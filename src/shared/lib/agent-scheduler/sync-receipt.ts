import { createHash } from 'node:crypto';
import { LEASE_MS, taskError, type TaskReference } from '@/shared/lib/agent-scheduler/task-contract';
export interface SyncReceipt { status: 'running' | 'done' | 'uncertain'; result?: unknown }
export interface SyncReceiptStore {
  begin: (ref: TaskReference, key: string, effectId: string, cutoff: Date) => Promise<boolean>;
  read: (ref: TaskReference, key: string, effectId: string) => Promise<SyncReceipt | null>;
  complete: (ref: TaskReference, key: string, effectId: string, result: unknown) => Promise<boolean>;
  uncertain: (ref: TaskReference, key: string, effectId: string) => Promise<void>;
}
const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
};
export const runSyncReceipt = async (store: SyncReceiptStore, ref: TaskReference, key: string, operation: string, payload: Record<string, unknown>, run: () => Promise<unknown>, now = new Date()): Promise<unknown> => {
  const effectId = createHash('sha256').update(JSON.stringify(canonical({ operation, payload }))).digest('hex');
  const started = await store.begin(ref, key, effectId, new Date(Number(now) - LEASE_MS));
  if (!started) {
    const receipt = await store.read(ref, key, effectId);
    if (receipt?.status === 'done') return receipt.result;
    await store.uncertain(ref, key, effectId);
    return taskError('sync_uncertain');
  }
  try {
    const result = await run();
    if (!await store.complete(ref, key, effectId, result)) return taskError('sync_uncertain');
    return result;
  } catch {
    await store.uncertain(ref, key, effectId).catch(() => undefined);
    return taskError('sync_uncertain');
  }
};
