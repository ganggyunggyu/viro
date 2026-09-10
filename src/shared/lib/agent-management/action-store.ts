import { enqueueIdempotentRequest } from '@/shared/lib/agent-management/idempotent-request';
import { createSchedulerDispatch } from '@/shared/lib/agent-scheduler/outbox';
import { dispatchSchedulerTask } from '@/shared/lib/agent-scheduler/outbox-store';
import { connectDB } from '@/shared/lib/mongodb';
import { Account, Cafe, WorkerHeartbeat, touchWorkerHeartbeat } from '@/shared/models';
import { AgentAction, type IAgentAction } from '@/shared/models/agent-action';
import { actionResources, parseRemoteAction } from '@/shared/lib/agent-management/action-contract';
import { AgentManagementError } from '@/shared/lib/agent-management/contract';
import type { ViroDesktopActionResponse } from '@/shared/types/viro-desktop';
import { claimPendingTask, type TargetedClaim } from '@/shared/lib/agent-management/targeted-claim';

const KIND = 'agent-actions-v1';
const view = ({ _id: id, action, status, executionTarget, result, createdAt, updatedAt }: IAgentAction) => ({ id, action, status, executionTarget, result, createdAt, updatedAt });
const workerKey = (userId: string, tokenId: string, workerId: string) => `${KIND}:${userId}:${tokenId}:${workerId}`;

export const actionWorkerOnline = async (userId: string) => {
  await connectDB();
  return Boolean(await WorkerHeartbeat.exists({ userId, kind: KIND, lastSeenAt: { $gte: new Date(Date.now() - 120000) } }));
};

const markUncertain = async (userId: string) => {
  await AgentAction.updateMany({ userId, status: 'running', claimedAt: { $lt: new Date(Date.now() - 30 * 60000) } }, {
    $set: { status: 'needs_review', result: { success: false, error: '작업 프로그램 응답이 끊겼습니다. 실제 결과 확인이 필요합니다.' } },
  });
};

export const prepareAction = async (userId: string, raw: unknown) => {
  const action = parseRemoteAction(raw);
  await connectDB();
  const { accountIds, cafeIds } = actionResources(action);
  const [accounts, cafes] = await Promise.all([
    Account.countDocuments({ userId, isActive: true, accountId: { $in: accountIds } }),
    Cafe.countDocuments({ userId, isActive: true, cafeId: { $in: cafeIds } }),
  ]);
  if (accounts !== accountIds.length || cafes !== cafeIds.length) throw new AgentManagementError('등록된 계정 또는 카페를 찾을 수 없습니다', 404);
  return action;
};

export const enqueueAction = async (userId: string, key: unknown, raw: unknown) => {
  const action = parseRemoteAction(raw);
  await connectDB();
  const result = await enqueueIdempotentRequest({
    find: async (owner, id) => AgentAction.findOne({ _id: id, userId: owner }).lean<IAgentAction>(),
    create: async (owner, id, fingerprint, input) => {
      await prepareAction(owner, input);
      const doc = await AgentAction.create({ _id: id, userId: owner, fingerprint, action: input, ...createSchedulerDispatch() });
      return doc.toObject();
    },
  }, userId, key, action);
  if (!result.replayed) await dispatchSchedulerTask('action', result.operation);
  return { task: view(result.operation), replayed: result.replayed };
};

export const readActions = async (userId: string, id?: string) => {
  await connectDB(); await markUncertain(userId);
  const tasks = await AgentAction.find({ userId, ...(id ? { _id: id } : {}) }).sort({ createdAt: -1 }).limit(50).lean<IAgentAction[]>();
  if (id && !tasks.length) throw new AgentManagementError('작업을 찾을 수 없습니다', 404);
  return tasks.map(view);
};

export const heartbeatAction = async (userId: string, tokenId: string, workerId: string, id?: string) => {
  await connectDB();
  const claimedBy = workerKey(userId, tokenId, workerId);
  await touchWorkerHeartbeat({ workerId: claimedBy, userId, label: workerId, kind: KIND });
  if (!id) return true;
  const result = await AgentAction.updateOne({ _id: id, userId, claimedBy, status: 'running' }, { $set: { claimedAt: new Date() } });
  return result.matchedCount === 1;
};

const claimStoredAction = async (userId: string, tokenId: string, workerId: string, target?: TargetedClaim) => {
  const task = await claimPendingTask({
    prepare: async () => {
      await heartbeatAction(userId, tokenId, workerId);
      await markUncertain(userId);
    },
    claim: async (filter, update, options) => AgentAction.findOneAndUpdate(filter, update, options).lean<IAgentAction>(),
  }, userId, workerKey(userId, tokenId, workerId), target);
  return task ? view(task) : null;
};

export const claimAction = async (userId: string, tokenId: string, workerId: string) =>
  claimStoredAction(userId, tokenId, workerId);

export const claimActionById = async (userId: string, tokenId: string, workerId: string, taskId: unknown) =>
  claimStoredAction(userId, tokenId, workerId, { kind: 'action', id: taskId });

export const finishAction = async (userId: string, tokenId: string, workerId: string, id: string, result: ViroDesktopActionResponse, uncertain: boolean) => {
  await connectDB();
  const updated = await AgentAction.updateOne({ _id: id, userId, claimedBy: workerKey(userId, tokenId, workerId), status: { $in: ['running', 'needs_review'] } }, {
    $set: { status: uncertain ? 'needs_review' : result.success ? 'done' : 'failed', result },
  });
  return updated.matchedCount === 1;
};
