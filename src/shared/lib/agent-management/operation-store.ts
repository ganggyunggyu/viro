import { parseOperation, type AgentOperationInput } from '@/shared/lib/agent-management/contract';
import { enqueueIdempotentRequest, type IdempotentStore } from '@/shared/lib/agent-management/idempotent-request';

export const enqueueIdempotentOperation = async <T extends { fingerprint: string }>(
  store: IdempotentStore<AgentOperationInput, T>, userId: string, key: string | null, input: AgentOperationInput,
): Promise<{ operation: T; replayed: boolean }> =>
  enqueueIdempotentRequest(store, userId, key, parseOperation(input), 24);
