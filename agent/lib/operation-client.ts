import { createBrokerPost, type CommentAccount, type AgentCafe } from './broker-client';
import type { AgentConfig } from './config';
import type { AgentOperationView, AgentOperationResult } from '../../src/shared/lib/agent-management/contract';
import type { SolveCaptchaInput } from '../../src/shared/lib/captcha-client';

export interface ClaimedOperation {
  operation: AgentOperationView;
  account: CommentAccount;
  cafe: Pick<AgentCafe, 'cafeId' | 'cafeUrl' | 'name'>;
}

export const createOperationClient = (config: AgentConfig) => {
  const post = createBrokerPost(config);
  const claim = async (): Promise<ClaimedOperation | null> => {
    const response = await post('/api/agent/operations/claim', { workerId: config.workerId });
    return response.claimed as ClaimedOperation | null;
  };
  const heartbeat = async (operationId?: string): Promise<boolean> => {
    const response = await post('/api/agent/operations/heartbeat', { workerId: config.workerId, operationId });
    return response.ok === true;
  };
  const report = async (operationId: string, result: AgentOperationResult): Promise<boolean> => {
    const response = await post('/api/agent/operations/result', { workerId: config.workerId, operationId, result });
    return response.ok === true;
  };
  const solveCaptcha = async (input: SolveCaptchaInput): Promise<string> => {
    const response = await post('/api/agent/captcha', { ...input });
    if (typeof response.answer !== 'string' || !response.answer.trim()) throw new Error('캡차 응답을 확인하지 못했습니다');
    return response.answer.trim();
  };
  return { claim, heartbeat, report, solveCaptcha };
};

export type OperationClient = ReturnType<typeof createOperationClient>;
