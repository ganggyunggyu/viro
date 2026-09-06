import type { AgentOperationResult } from '../../src/shared/lib/agent-management/contract';
import type { ClaimedOperation, OperationClient } from './operation-client';

export const processClaimedOperation = async (
  claimed: ClaimedOperation,
  client: Pick<OperationClient, 'heartbeat' | 'report'>,
  execute: (input: ClaimedOperation) => Promise<AgentOperationResult>,
): Promise<void> => {
  const { operation: { id } } = claimed;
  // Verify ownership immediately before the external write. A lost claim must not execute.
  if (!await client.heartbeat(id)) throw new Error('작업 실행 권한을 확인하지 못했습니다');
  let result: AgentOperationResult;
  try {
    result = await execute(claimed);
  } catch {
    result = { success: false, requiresReview: true, error: '실행 중 오류가 발생했습니다. 실제 카페 결과를 확인하세요.' };
  }
  // Reporting failure must never rerun execute; the durable record becomes needs_review.
  if (!await client.report(id, result)) throw new Error('작업 결과를 저장하지 못했습니다');
};
