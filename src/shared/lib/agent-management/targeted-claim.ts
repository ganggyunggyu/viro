import { AgentManagementError } from '@/shared/lib/agent-management/contract';

export interface PendingClaimFilter {
  userId: string;
  status: 'pending';
  executionTarget: { $ne: 'scheduler' };
  _id?: string;
}

export interface PendingClaimUpdate {
  $set: { status: 'running'; claimedAt: Date; claimedBy: string };
}

export interface PendingClaimStore<T> {
  prepare: () => Promise<void>;
  claim: (filter: PendingClaimFilter, update: PendingClaimUpdate, options: { sort: { createdAt: 1 }; new: true }) => Promise<T | null>;
}

export interface TargetedClaim {
  kind: 'operation' | 'action';
  id: unknown;
}

export const claimPendingTask = async <T>(
  store: PendingClaimStore<T>, userId: string, claimedBy: string, target?: TargetedClaim,
): Promise<T | null> => {
  const filter: PendingClaimFilter = { userId, status: 'pending', executionTarget: { $ne: 'scheduler' } };
  if (target) {
    const { kind, id } = target;
    const length = kind === 'operation' ? 24 : 64;
    if (typeof id !== 'string' || id.length !== length || !/^[a-f0-9]+$/.test(id)) {
      throw new AgentManagementError(`${kind === 'operation' ? 'operationId' : 'taskId'} 값이 올바르지 않습니다`);
    }
    filter._id = id;
  }
  await store.prepare();
  return store.claim(filter, {
    $set: { status: 'running', claimedAt: new Date(), claimedBy },
  }, { sort: { createdAt: 1 }, new: true });
};
