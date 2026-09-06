import { AgentManagementError, operationIdentity, type AgentOperationInput } from '@/shared/lib/agent-management/contract';

interface StoredOperation { fingerprint: string }
interface OperationStore<T extends StoredOperation> {
  find: (userId: string, id: string) => Promise<T | null>;
  create: (userId: string, id: string, fingerprint: string, input: AgentOperationInput) => Promise<T>;
}

/** Mongo _id is deterministic, so the unique index protects concurrent retries too. */
export const enqueueIdempotentOperation = async <T extends StoredOperation>(
  store: OperationStore<T>, userId: string, key: string | null, input: AgentOperationInput,
): Promise<{ operation: T; replayed: boolean }> => {
  const { id, fingerprint } = operationIdentity(userId, key, input);
  const replay = (operation: T) => {
    if (operation.fingerprint !== fingerprint) {
      throw new AgentManagementError('동일한 요청 키가 다른 작업에 사용되었습니다', 409, 'idempotency_conflict');
    }
    return { operation, replayed: true };
  };
  const existing = await store.find(userId, id);
  if (existing) return replay(existing);
  try {
    return { operation: await store.create(userId, id, fingerprint, input), replayed: false };
  } catch (error) {
    if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 11000) throw error;
    const concurrent = await store.find(userId, id);
    if (!concurrent) throw error;
    return replay(concurrent);
  }
};
