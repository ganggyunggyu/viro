import type { AgentConfig } from './config';

export type AgentJobMode = 'fixed' | 'generate' | 'agent';

/**
 * 브로커 claim이 내려주는 잡. ManualCommentJob의 실행에 필요한 필드만 담는다.
 * (계정 자격증명 풀은 다음 슬라이스에서 accounts 필드로 추가된다.)
 */
export interface BrokerJob {
  _id: string;
  userId: string;
  articleUrl: string;
  cafeSlug: string;
  cafeId: string;
  articleId: number;
  mode: AgentJobMode;
  fixedComments?: string[];
  generateMinCount?: number;
  generateMaxCount?: number;
  delayMinMs: number;
  delayMaxMs: number;
  deleteExisting: boolean;
}

export interface AgentCommentResult {
  index: number;
  accountId?: string;
  nickname?: string;
  content: string;
  success: boolean;
  error?: string;
  commentId?: string;
  postedAt?: string;
}

export interface AgentCompletePayload {
  status: 'done' | 'failed';
  results?: AgentCommentResult[];
  errorMessage?: string;
  agentSummary?: string;
}

export interface BrokerClient {
  claim: () => Promise<BrokerJob | null>;
  heartbeat: (jobId: string) => Promise<boolean>;
  report: (jobId: string, payload: AgentCompletePayload) => Promise<boolean>;
}

export const createBrokerClient = (config: AgentConfig): BrokerClient => {
  const post = async (path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const response = await fetch(`${config.brokerUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      throw new Error('에이전트 토큰 인증 실패(401). 토큰을 다시 확인하세요.');
    }

    if (!response.ok) {
      throw new Error(`브로커 오류 ${response.status} (${path})`);
    }

    return (await response.json()) as Record<string, unknown>;
  };

  const claim = async (): Promise<BrokerJob | null> => {
    const data = await post('/api/agent/claim', { workerId: config.workerId });
    return (data.job as BrokerJob | null) ?? null;
  };

  const heartbeat = async (jobId: string): Promise<boolean> => {
    const data = await post('/api/agent/heartbeat', { jobId, workerId: config.workerId });
    return Boolean(data.ok);
  };

  const report = async (jobId: string, payload: AgentCompletePayload): Promise<boolean> => {
    const data = await post('/api/agent/result', { jobId, ...payload });
    return Boolean(data.ok);
  };

  return { claim, heartbeat, report };
};
