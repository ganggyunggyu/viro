import { connectDB } from '@/shared/lib/mongodb';
import { parseTaskReference, parseWorkerId, taskError, type SchedulerKind, type TaskReference } from '@/shared/lib/agent-scheduler/task-contract';
import { readTaskDoc, updateTaskDoc } from '@/shared/lib/agent-scheduler/task-model';
import { schedulerTaskFilter } from '@/shared/lib/agent-scheduler/task-store';

export type SchedulerAbortCode = 'preparation_failed' | 'execution_uncertain';
export interface SchedulerAbortStore {
  update: (kind: SchedulerKind, filter: Record<string, unknown>, update: Record<string, unknown>) => Promise<boolean>;
  find: (kind: SchedulerKind, filter: Record<string, unknown>) => Promise<{ status: string; claimedBy?: string } | null>;
}
const preparationError = '작업 실행 준비에 실패했습니다. 서버 상태를 확인하세요.';
const uncertainError = '작업 실행 여부를 확인할 수 없습니다. 실제 결과를 확인하세요.';
const workerPrefix = (workerId: string) => `^scheduler:${workerId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`;

export const createAbortHandler = (store: SchedulerAbortStore) => async (
  ref: TaskReference, workerId: string, code: SchedulerAbortCode,
): Promise<{ ok: true }> => {
  const task = parseTaskReference(ref.kind, ref.id, ref.dispatchId);
  const worker = parseWorkerId(workerId);
  if (code !== 'preparation_failed' && code !== 'execution_uncertain') return taskError('invalid_abort', 400);
  const filter = schedulerTaskFilter(task);
  const failed = await store.update(task.kind, { ...filter, status: 'pending' }, {
    $set: { status: 'failed', result: { success: false, error: code === 'preparation_failed' ? preparationError : uncertainError } },
  });
  if (failed) return { ok: true };
  const quarantined = await store.update(task.kind, {
    ...filter, status: 'running', claimedBy: { $regex: workerPrefix(worker) },
  }, { $set: { status: 'needs_review', result: { success: false, requiresReview: true, error: uncertainError } } });
  if (quarantined) return { ok: true };
  const row = await store.find(task.kind, filter);
  if (!row) return taskError('task_not_found', 404);
  if (row.status === 'done' || row.status === 'failed' || row.status === 'needs_review') return { ok: true };
  return taskError('lease_lost', 409);
};

export const abortSchedulerTask = createAbortHandler({
  update: async (kind, filter, update) => {
    await connectDB();
    return (await updateTaskDoc(kind, filter, update)).matchedCount === 1;
  },
  find: async (kind, filter) => {
    await connectDB();
    return readTaskDoc(kind, filter);
  },
});
