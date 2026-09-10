import { randomUUID } from 'node:crypto';
import { LEASE_MS, leaseKey, ownerScope, parseTaskBody, parseTaskReference, parseWorkerId, taskError, type SchedulerTask, type SchedulerVerb, type TaskReference } from '@/shared/lib/agent-scheduler/task-contract';
import { objectBody, parseOperationResult, textField } from '@/shared/lib/agent-management/contract';
import { safeActionResult } from '@/shared/lib/agent-management/action-result';
import { assertTaskCaptchaKind, parseCaptchaKind, parseTaskCaptchaPayload, type TaskCaptchaPayload, type TaskCaptchaAnswer } from '@/shared/lib/agent-scheduler/captcha-contract';

export interface SchedulerTaskStore {
  find: (ref: TaskReference) => Promise<SchedulerTask | null>;
  claim: (ref: TaskReference, claimedBy: string, now: Date) => Promise<SchedulerTask | null>;
  expire: (ref: TaskReference, cutoff: Date) => Promise<void>;
  renew: (ref: TaskReference, claimedBy: string, cutoff: Date, now: Date) => Promise<boolean>;
  finish: (ref: TaskReference, claimedBy: string, cutoff: Date, status: string, result: unknown) => Promise<boolean>;
}
export interface SchedulerTaskDependencies {
  store: SchedulerTaskStore;
  context: (task: SchedulerTask) => Promise<{ accounts: Array<{ accountId: string; password: string; nickname?: string }>; cafes: Array<{ cafeId: string; cafeUrl: string; name: string }> }>;
  sync: (task: SchedulerTask, operation: string, payload: Record<string, unknown>) => Promise<unknown>;
  prepare: (task: SchedulerTask, operation: string, payload: Record<string, unknown>) => Promise<unknown>;
  captcha?: (task: SchedulerTask, workerId: string, leaseId: string, payload: TaskCaptchaPayload) => Promise<TaskCaptchaAnswer>;
  now?: () => Date;
}
const activeLease = (task: SchedulerTask | null, key: string, cutoff: Date): task is SchedulerTask => Boolean(task && task.status === 'running' && task.claimedBy === key && task.claimedAt && Number(task.claimedAt) >= Number(cutoff));
const parseResult = (kind: string, body: Record<string, unknown>) => {
  if (kind === 'operation') {
    if (body.uncertain !== undefined) return taskError('invalid_result', 400);
    const result = parseOperationResult(body.result);
    return { result, status: result.requiresReview ? 'needs_review' : result.success ? 'done' : 'failed' };
  }
  if (typeof body.uncertain !== 'boolean') return taskError('invalid_result', 400);
  const result = safeActionResult(body.result);
  return { result, status: body.uncertain ? 'needs_review' : result.success ? 'done' : 'failed' };
};

const claim = async ({ store, context }: SchedulerTaskDependencies, ref: TaskReference, body: Record<string, unknown>, now: Date) => {
  const workerId = parseWorkerId(body.workerId);
  const leaseId = randomUUID();
  const key = leaseKey(workerId, leaseId);
  const claimed = await store.claim(ref, key, now);
  if (!claimed) return { claimed: null };
  const identity = { ownerScope: ownerScope(claimed.userId), leaseId };
  const times = { createdAt: claimed.createdAt?.toISOString(), updatedAt: claimed.updatedAt?.toISOString() };
  if (ref.kind === 'action') return { claimed: { ...identity, task: { id: ref.id, action: claimed.action, status: claimed.status, ...times, executionTarget: 'scheduler' } } };
  try {
    const { accounts, cafes } = await context(claimed);
    const account = accounts.find(({ accountId }) => accountId === claimed.operation?.accountId);
    const cafe = cafes.find(({ cafeId }) => cafeId === claimed.operation?.cafeId);
    if (!account || !cafe) return taskError('resource_not_found', 404);
    return { claimed: { ...identity, operation: { ...claimed.operation, id: ref.id, status: claimed.status, ...times, executionTarget: 'scheduler' }, account, cafe } };
  } catch {
    await store.finish(ref, key, new Date(Number(now) - LEASE_MS), 'failed', { success: false, error: '등록된 계정 또는 카페를 찾을 수 없습니다' });
    return taskError('resource_not_found', 404);
  }
};

export const runSchedulerTask = async (dependencies: SchedulerTaskDependencies, reference: TaskReference, verb: SchedulerVerb, input: Record<string, unknown>): Promise<unknown> => {
  const { store } = dependencies;
  const body = parseTaskBody(verb, input);
  const ref = parseTaskReference(reference.kind, reference.id, body.dispatchId);
  const captcha = verb === 'captcha' ? parseTaskCaptchaPayload(body.payload) : null;
  const captchaKind = captcha?.kind || (verb === 'captcha-authorize' ? parseCaptchaKind(body.captchaKind) : null);
  const now = dependencies.now?.() || new Date();
  const cutoff = new Date(Number(now) - LEASE_MS);
  await store.expire(ref, cutoff);
  const task = await store.find(ref);
  if (!task) return taskError('task_not_found', 404);
  if (verb === 'authorize') return { authorized: true, ownerScope: ownerScope(task.userId) };
  if (verb === 'claim') return claim(dependencies, ref, body, now);
  const key = leaseKey(body.workerId, body.leaseId);
  const completion = verb === 'result' ? parseResult(ref.kind, body) : null;
  if (completion && task.claimedBy === key && task.status === completion.status && JSON.stringify(task.result) === JSON.stringify(completion.result)) return { ok: true };
  if (!activeLease(task, key, cutoff)) return taskError('lease_lost');
  if (captchaKind) {
    assertTaskCaptchaKind(task, captchaKind);
    if (!captcha) return { authorized: true, ownerScope: ownerScope(task.userId) };
    if (!dependencies.captcha) return taskError('captcha_service_unavailable', 502);
    const answer = await dependencies.captcha(task, parseWorkerId(body.workerId), body.leaseId as string, captcha);
    const answerCutoff = new Date(Number(dependencies.now?.() || new Date()) - LEASE_MS);
    await store.expire(ref, answerCutoff);
    const current = await store.find(ref);
    if (!activeLease(current, key, answerCutoff) || current.userId !== task.userId) return taskError('lease_lost');
    assertTaskCaptchaKind(current, captchaKind);
    return answer;
  }
  if (verb === 'heartbeat') {
    if (!await store.renew(ref, key, cutoff, now)) return taskError('lease_lost');
    return { ok: true };
  }
  if (completion) {
    if (!await store.finish(ref, key, cutoff, completion.status, completion.result)) return taskError('lease_lost');
    return { ok: true };
  }
  if (verb === 'context') return dependencies.context(task);
  const operation = textField(body.operation, 'operation', 64);
  if (!body.payload || typeof body.payload !== 'object' || Array.isArray(body.payload)) return taskError('invalid_payload', 400);
  const payload = objectBody(body.payload, Object.keys(body.payload));
  return verb === 'sync' ? dependencies.sync(task, operation, payload) : dependencies.prepare(task, operation, payload);
};
