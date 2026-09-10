import { createSchedulerDispatch } from '@/shared/lib/agent-scheduler/outbox';
import { dispatchSchedulerTask } from '@/shared/lib/agent-scheduler/outbox-store';
import { connectDB } from '@/shared/lib/mongodb';
import { Account, Cafe, AgentOperation, WorkerHeartbeat, touchWorkerHeartbeat, type IAgentOperation } from '@/shared/models';
import { AgentManagementError, parseOperation, parseOperationId, type AgentOperationResult, type AgentOperationView } from '@/shared/lib/agent-management/contract';
import { enqueueIdempotentOperation } from '@/shared/lib/agent-management/operation-store';
import { claimPendingTask, type TargetedClaim } from '@/shared/lib/agent-management/targeted-claim';
import { safeOperationFailure } from '@/shared/lib/agent-management/operation-failure';

const WORKER_KIND = 'agent-operations';
const CLAIM_TIMEOUT_MS = 30 * 60_000;

export const toOperationView = (doc: IAgentOperation): AgentOperationView => ({
  id: String(doc._id), type: doc.type, accountId: doc.accountId, cafeId: doc.cafeId,
  articleId: doc.articleId, content: doc.content, nickname: doc.nickname, status: doc.status, executionTarget: doc.executionTarget,
  result: doc.result ? { success: doc.result.success, requiresReview: doc.result.requiresReview, commentId: doc.result.commentId, membershipStatus: doc.result.membershipStatus,
    ...(doc.result.error !== undefined || doc.result.errorCode !== undefined ? safeOperationFailure(doc.result.error, doc.result.errorCode, doc.result.requiresReview === true) : {}) } : undefined,
  createdAt: new Date(doc.createdAt).toISOString(), updatedAt: new Date(doc.updatedAt).toISOString(),
});

const markUncertainOperations = async (userId: string): Promise<void> => {
  // A process may have posted before losing its connection. Never automatically retry a write.
  await AgentOperation.updateMany({ userId, status: 'running', claimedAt: { $lt: new Date(Date.now() - CLAIM_TIMEOUT_MS) } }, {
    $set: { status: 'needs_review', result: { success: false, error: '워커 응답이 끊겼습니다. 실제 카페 결과를 확인한 뒤 재요청하세요.' } },
  });
};

export const enqueueAgentOperation = async (userId: string, key: string | null, raw: unknown) => {
  const input = parseOperation(raw);
  await connectDB();
  const result = await enqueueIdempotentOperation({
    find: async (owner, id) => AgentOperation.findOne({ _id: id, userId: owner }).lean<IAgentOperation>(),
    create: async (owner, id, fingerprint, operation) => {
      const [account, cafe] = await Promise.all([
        Account.exists({ userId: owner, accountId: operation.accountId, isActive: true }),
        Cafe.exists({ userId: owner, cafeId: operation.cafeId, isActive: true }),
      ]);
      if (!account || !cafe) throw new AgentManagementError('등록된 계정 또는 카페를 찾을 수 없습니다', 404, 'resource_not_found');
      const doc = await AgentOperation.create({ _id: id, userId: owner, fingerprint, ...operation, ...createSchedulerDispatch() });
      return doc.toObject();
    },
  }, userId, key, input);
  if (!result.replayed) await dispatchSchedulerTask('operation', result.operation);
  return { operation: toOperationView(result.operation), replayed: result.replayed };
};

export const listAgentOperations = async (userId: string, limit: string | null) => {
  const parsedLimit = limit === null ? 50 : Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) throw new AgentManagementError('limit은 1~100이어야 합니다');
  await connectDB();
  await markUncertainOperations(userId);
  const rows = await AgentOperation.find({ userId }).sort({ createdAt: -1 }).limit(parsedLimit).lean<IAgentOperation[]>();
  return rows.map(toOperationView);
};

export const getAgentOperation = async (userId: string, operationId: string) => {
  const id = parseOperationId(operationId);
  await connectDB();
  await markUncertainOperations(userId);
  const row = await AgentOperation.findOne({ _id: id, userId }).lean<IAgentOperation>();
  if (!row) throw new AgentManagementError('작업을 찾을 수 없습니다', 404, 'operation_not_found');
  return toOperationView(row);
};

const workerKey = (userId: string, tokenId: string, workerId: string): string => `${WORKER_KIND}:${userId}:${tokenId}:${workerId}`;

export const touchOperationWorker = async (userId: string, tokenId: string, workerId: string): Promise<void> => {
  await connectDB();
  await touchWorkerHeartbeat({ workerId: workerKey(userId, tokenId, workerId), userId, label: workerId, kind: WORKER_KIND });
};

export const operationWorkerOnline = async (userId: string): Promise<boolean> => {
  await connectDB();
  return Boolean(await WorkerHeartbeat.exists({ userId, kind: WORKER_KIND, lastSeenAt: { $gte: new Date(Date.now() - 120_000) } }));
};

const claimOperation = async (userId: string, tokenId: string, workerId: string, target?: TargetedClaim) => {
  const operation = await claimPendingTask({
    prepare: async () => {
      await touchOperationWorker(userId, tokenId, workerId);
      await markUncertainOperations(userId);
    },
    claim: async (filter, update, options) => AgentOperation.findOneAndUpdate(filter, update, options).lean<IAgentOperation>(),
  }, userId, workerKey(userId, tokenId, workerId), target);
  if (!operation) return null;
  const [account, cafe] = await Promise.all([
    Account.findOne({ userId, accountId: operation.accountId, isActive: true }).select('accountId password nickname').lean(),
    Cafe.findOne({ userId, cafeId: operation.cafeId, isActive: true }).select('cafeId cafeUrl name').lean(),
  ]);
  if (!account || !cafe) {
    await finishAgentOperation(userId, tokenId, workerId, String(operation._id), { success: false, error: '등록된 계정 또는 카페를 찾을 수 없습니다' });
    return null;
  }
  // This endpoint is worker-only; it is intentionally absent from model capability discovery.
  return { operation: toOperationView(operation), account: { accountId: account.accountId, password: account.password, nickname: account.nickname }, cafe: { cafeId: cafe.cafeId, cafeUrl: cafe.cafeUrl, name: cafe.name } };
};

export const claimAgentOperation = async (userId: string, tokenId: string, workerId: string) =>
  claimOperation(userId, tokenId, workerId);

export const claimAgentOperationById = async (userId: string, tokenId: string, workerId: string, operationId: unknown) =>
  claimOperation(userId, tokenId, workerId, { kind: 'operation', id: operationId });

export const heartbeatAgentOperation = async (userId: string, tokenId: string, workerId: string, operationId?: string): Promise<boolean> => {
  await touchOperationWorker(userId, tokenId, workerId);
  if (!operationId) return true;
  const result = await AgentOperation.updateOne({ _id: parseOperationId(operationId), userId, claimedBy: workerKey(userId, tokenId, workerId), status: 'running' }, { $set: { claimedAt: new Date() } });
  return result.matchedCount === 1;
};

export const finishAgentOperation = async (userId: string, tokenId: string, workerId: string, operationId: string, result: AgentOperationResult): Promise<boolean> => {
  await connectDB();
  const updated = await AgentOperation.updateOne({ _id: parseOperationId(operationId), userId, claimedBy: workerKey(userId, tokenId, workerId), status: { $in: ['running', 'needs_review'] } }, {
    $set: { status: result.requiresReview ? 'needs_review' : result.success ? 'done' : 'failed', result },
  });
  return updated.matchedCount === 1;
};
