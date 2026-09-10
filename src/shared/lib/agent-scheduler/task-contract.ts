import { createHash } from 'node:crypto';
import { AgentManagementError, objectBody, textField, type AgentOperationInput } from '@/shared/lib/agent-management/contract';
import type { ViroDesktopAction } from '@/shared/types/viro-desktop';

export type SchedulerKind = 'operation' | 'action';
export type SchedulerVerb = 'authorize' | 'claim' | 'heartbeat' | 'result' | 'context' | 'sync' | 'prepare' | 'captcha' | 'captcha-authorize';
export interface TaskReference { kind: SchedulerKind; id: string; dispatchId: string }
export interface SchedulerTask extends TaskReference {
  userId: string; status: 'pending' | 'running' | 'done' | 'failed' | 'needs_review';
  claimedBy?: string; claimedAt?: Date; result?: unknown;
  createdAt?: Date; updatedAt?: Date;
  operation?: AgentOperationInput; action?: ViroDesktopAction;
}
export const LEASE_MS = 30 * 60_000;
export const ownerScope = (userId: string): string => createHash('sha256').update(userId).digest('hex');
export const taskError = (code: string, status = 409): never => { throw new AgentManagementError(code, status, code); };
export const parseTaskReference = (kind: unknown, id: unknown, dispatchId: unknown): TaskReference => {
  if (kind !== 'operation' && kind !== 'action') return taskError('invalid_task', 400);
  const length = kind === 'operation' ? 24 : 64;
  if (typeof id !== 'string' || !new RegExp(`^[a-f0-9]{${length}}$`).test(id)) return taskError('invalid_task', 400);
  if (typeof dispatchId !== 'string' || !/^[a-f0-9]{64}$/.test(dispatchId)) return taskError('invalid_dispatch', 400);
  return { kind, id, dispatchId };
};
export const parseWorkerId = (value: unknown): string => {
  const worker = textField(value, 'workerId', 128);
  if (!/^[a-zA-Z0-9._-]+$/.test(worker)) return taskError('invalid_worker', 400);
  return worker;
};
export const leaseKey = (workerId: unknown, leaseId: unknown): string => {
  if (typeof leaseId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(leaseId)) return taskError('invalid_lease', 400);
  return `scheduler:${parseWorkerId(workerId)}:${leaseId}`;
};
export const parseTaskBody = (verb: string, input: unknown): Record<string, unknown> => {
  const extra: Record<SchedulerVerb | 'abort', string[]> = { abort: ['workerId', 'code'], authorize: [], claim: ['workerId'], heartbeat: ['workerId', 'leaseId'], result: ['workerId', 'leaseId', 'result', 'uncertain'], context: ['workerId', 'leaseId'], sync: ['workerId', 'leaseId', 'operation', 'payload'], prepare: ['workerId', 'leaseId', 'operation', 'payload'], captcha: ['workerId', 'leaseId', 'payload'], 'captcha-authorize': ['workerId', 'leaseId', 'captchaKind'] };
  if (!Object.hasOwn(extra, verb)) return taskError('not_found', 404);
  return objectBody(input, ['dispatchId', ...extra[verb as SchedulerVerb]]);
};
