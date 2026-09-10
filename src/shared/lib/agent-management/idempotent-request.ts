import { createHash } from 'node:crypto';
import { AgentManagementError, textField } from '@/shared/lib/agent-management/contract';

export interface IdempotentStore<Input, Stored extends { fingerprint: string }> {
  find: (owner: string, id: string) => Promise<Stored | null>;
  create: (owner: string, id: string, fingerprint: string, input: Input) => Promise<Stored>;
}

/** 모든 실행 큐가 같은 소유자별 요청 키와 동시 접수 충돌 처리를 사용한다. */
export const enqueueIdempotentRequest = async <Input, Stored extends { fingerprint: string }>(
  store: IdempotentStore<Input, Stored>, owner: string, key: unknown, input: Input, idLength = 64,
): Promise<{ operation: Stored; replayed: boolean }> => {
  const requestKey = textField(key, 'Idempotency-Key', 128);
  if (!/^[a-zA-Z0-9._-]+$/.test(requestKey)) throw new AgentManagementError('Idempotency-Key 값이 올바르지 않습니다');
  const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const id = hash([owner, requestKey]).slice(0, idLength); const fingerprint = hash(input);
  const replay = (operation: Stored) => {
    if (operation.fingerprint !== fingerprint) throw new AgentManagementError('동일한 요청 키가 다른 작업에 사용되었습니다', 409, 'idempotency_conflict');
    return { operation, replayed: true };
  };
  const existing = await store.find(owner, id);
  if (existing) return replay(existing);
  try { return { operation: await store.create(owner, id, fingerprint, input), replayed: false }; }
  catch (error) {
    if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 11000) throw error;
    const concurrent = await store.find(owner, id);
    if (!concurrent) throw error;
    return replay(concurrent);
  }
};
