import { connectDB } from '@/shared/lib/mongodb';
import type { IAgentOperation } from '@/shared/models/agent-operation';
import type { IAgentAction } from '@/shared/models/agent-action';
import { readTaskDoc, updateTaskDoc, claimTaskDoc } from '@/shared/lib/agent-scheduler/task-model';
import type { SchedulerTask, TaskReference } from '@/shared/lib/agent-scheduler/task-contract';
import type { SchedulerTaskStore } from '@/shared/lib/agent-scheduler/task-service';

export const schedulerTaskFilter = ({ id, dispatchId }: TaskReference) => ({ _id: id, executionTarget: 'scheduler', dispatchId });
const normalize = (ref: TaskReference, row: IAgentOperation | IAgentAction | null): SchedulerTask | null => {
  if (!row) return null;
  const base = { ...ref, userId: row.userId, status: row.status, claimedBy: row.claimedBy, claimedAt: row.claimedAt, result: row.result, createdAt: row.createdAt, updatedAt: row.updatedAt };
  if ('action' in row) return { ...base, action: row.action };
  const { type, accountId, cafeId, articleId, content, nickname } = row;
  return { ...base, operation: { type, accountId, cafeId, articleId, content, nickname } };
};
const live = (ref: TaskReference, claimedBy: string, cutoff: Date) => ({ ...schedulerTaskFilter(ref), status: 'running', claimedBy, claimedAt: { $gte: cutoff } });

export const schedulerTaskStore: SchedulerTaskStore = {
  find: async (ref) => {
    await connectDB();
    return normalize(ref, await readTaskDoc(ref.kind, schedulerTaskFilter(ref)));
  },
  claim: async (ref, claimedBy, now) => {
    await connectDB();
    const row = await claimTaskDoc(ref.kind, { ...schedulerTaskFilter(ref), status: 'pending' }, { $set: { status: 'running', claimedBy, claimedAt: now } });
    return normalize(ref, row);
  },
  expire: async (ref, cutoff) => {
    await connectDB();
    await updateTaskDoc(ref.kind, { ...schedulerTaskFilter(ref), status: 'running', claimedAt: { $lt: cutoff } }, { $set: { status: 'needs_review', result: { success: false, requiresReview: true, error: '실행 서버의 응답이 끊겼습니다. 실제 결과를 확인하세요.' } } });
  },
  renew: async (ref, claimedBy, cutoff, now) => {
    await connectDB();
    return (await updateTaskDoc(ref.kind, live(ref, claimedBy, cutoff), { $set: { claimedAt: now } })).matchedCount === 1;
  },
  finish: async (ref, claimedBy, cutoff, status, result) => {
    await connectDB();
    return (await updateTaskDoc(ref.kind, live(ref, claimedBy, cutoff), { $set: { status, result } })).matchedCount === 1;
  },
};
