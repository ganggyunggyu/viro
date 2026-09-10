import { processClaimedOperation } from '../lib/operation-runner';
import { processActionTask } from '../lib/action-runner';
import { parseRemoteAction } from '../../src/shared/lib/agent-management/action-contract';
import type { executeAgentOperation } from '../operation-executor';
import type { executeDesktopAction } from '../desktop-actions';
import type { EmbeddedClient } from './client';
import type { EmbeddedExecution, EmbeddedTaskKind } from './types';
import { EmbeddedWorkerError } from './errors';

export interface ExecutionDependencies {
  client: EmbeddedClient;
  operation: typeof executeAgentOperation;
  action: typeof executeDesktopAction;
}

export const executeRequestedTask = async (
  kind: EmbeddedTaskKind, id: string, ownsLease: () => boolean, dependencies: ExecutionDependencies,
  onClaimed: () => void = () => {},
): Promise<EmbeddedExecution> => {
  const { client } = dependencies;
  if (!ownsLease()) throw new EmbeddedWorkerError('execution_uncertain');
  if (kind === 'operation') {
    const claimed = await client.claimOperation(id);
    if (claimed === null) return { kind, id, claimed: false, reported: false };
    if (!claimed || claimed.operation?.id !== id || claimed.operation.status !== 'running' || claimed.account?.accountId !== claimed.operation.accountId || claimed.cafe?.cafeId !== claimed.operation.cafeId) {
      throw new EmbeddedWorkerError('execution_uncertain');
    }
    onClaimed();
    await processClaimedOperation(claimed, {
      heartbeat: async (operationId) => ownsLease() && await client.operationHeartbeat(operationId),
      report: async (operationId, result) => client.reportOperation(operationId, ownsLease() ? result : { success: false, requiresReview: true, error: '실행 권한이 끊겼습니다. 실제 결과를 확인해 주세요.' }),
    }, dependencies.operation);
  } else {
    const task = await client.claimAction(id);
    if (task === null) return { kind, id, claimed: false, reported: false };
    if (!task || task.id !== id || task.status !== 'running') throw new EmbeddedWorkerError('execution_uncertain');
    onClaimed();
    await processActionTask(task.action, {
      heartbeat: async () => ownsLease() && await client.actionHeartbeat(id),
      execute: async (action) => dependencies.action(parseRemoteAction(action), client.broker),
      report: async (result, uncertain) => client.reportAction(id, ownsLease() ? result : { success: false, requiresReview: true }, uncertain || !ownsLease()),
    });
  }
  return { kind, id, claimed: true, reported: true };
};
