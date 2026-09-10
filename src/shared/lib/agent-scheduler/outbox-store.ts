import { connectDB } from '@/shared/lib/mongodb';
import { AgentOperation, type IAgentOperation } from '@/shared/models';
import { AgentAction, type IAgentAction } from '@/shared/models/agent-action';
import { signSchedulerRequest } from '@/shared/lib/agent-scheduler/service-auth';
import { createSchedulerOutbox, type SchedulerOutboxDocument, type SchedulerTask, type SchedulerTaskKind } from '@/shared/lib/agent-scheduler/outbox';

const pending = { executionTarget: 'scheduler', status: 'pending', dispatchState: 'pending' } as const;
const exact = ({ id, dispatchId }: SchedulerTask) => ({ ...pending, _id: id, dispatchId });

const beginAttempt = async (task: SchedulerTask): Promise<boolean> => {
  const filter = exact(task);
  const update = { $inc: { dispatchAttempts: 1 } };
  const result = task.kind === 'operation'
    ? await AgentOperation.updateOne(filter, update) : await AgentAction.updateOne(filter, update);
  return result.matchedCount === 1;
};
const markDelivered = async (task: SchedulerTask, deliveredAt: Date): Promise<boolean> => {
  const filter = exact(task);
  const update = { $set: { dispatchState: 'delivered', deliveredAt } };
  const result = task.kind === 'operation'
    ? await AgentOperation.updateOne(filter, update) : await AgentAction.updateOne(filter, update);
  return result.matchedCount === 1;
};
const findPending = async (limit: number) => {
  const [operations, actions] = await Promise.all([
    AgentOperation.find(pending).sort({ createdAt: 1 }).limit(limit).lean<IAgentOperation[]>(),
    AgentAction.find(pending).sort({ createdAt: 1 }).limit(limit).lean<IAgentAction[]>(),
  ]);
  return [
    ...operations.map((doc) => ({ kind: 'operation' as const, doc })),
    ...actions.map((doc) => ({ kind: 'action' as const, doc })),
  ].sort((left, right) => new Date(left.doc.createdAt).getTime() - new Date(right.doc.createdAt).getTime()).slice(0, limit);
};
const expireStale = async (): Promise<void> => {
  const filter = { executionTarget: 'scheduler', status: 'running', claimedAt: { $lt: new Date(Date.now() - 30 * 60_000) } };
  const update = { $set: { status: 'needs_review', result: { success: false, requiresReview: true, error: '작업 서버 응답이 끊겼습니다. 실제 결과 확인이 필요합니다.' } } };
  await Promise.all([AgentOperation.updateMany(filter, update), AgentAction.updateMany(filter, update)]);
};
const outbox = () => createSchedulerOutbox({
  url: process.env.VIRO_SCHEDULER_URL, secret: process.env.VIRO_SCHEDULER_SERVICE_SECRET,
  fetch: globalThis.fetch, signRequest: signSchedulerRequest, beginAttempt, markDelivered, findPending, expireStale,
});

/** Enqueue has already connected and persisted its task. Delivery failure never undoes acceptance. */
export const dispatchSchedulerTask = async (kind: SchedulerTaskKind, doc: SchedulerOutboxDocument): Promise<boolean> =>
  outbox().dispatch(kind, doc);

export const recoverSchedulerOutbox = async (limit = 50) => {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new RangeError('limit must be 1–100');
  await connectDB();
  return outbox().recover(limit);
};
