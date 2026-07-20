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
  results?: AgentCommentResult[];
  deleteResults?: AgentCommentDeleteResult[];
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

export interface AgentCommentDeleteResult {
  index: number;
  commentId: string;
  accountId?: string;
  nickname?: string;
  content: string;
  success: boolean;
  error?: string;
  deletedAt?: string;
}

export interface AgentArticleSnapshot {
  title: string;
  body: string;
  ownerNickname: string;
}

export interface AgentCommentPlan {
  comments: string[];
  summary?: string;
}

export interface AgentCompletePayload {
  status: 'done' | 'failed';
  results?: AgentCommentResult[];
  deleteResults?: AgentCommentDeleteResult[];
  errorMessage?: string;
  agentSummary?: string;
}

export interface CommentAccount {
  accountId: string;
  password: string;
  nickname?: string;
  isMain?: boolean;
  role?: 'writer' | 'commenter';
  excludeFromAutoComment?: boolean;
}

export interface AgentCafe {
  cafeId: string;
  cafeUrl: string;
  menuId: string;
  name: string;
  categories?: string[];
  isDefault?: boolean;
  categoryMenuIds?: Record<string, string>;
  categoryAliases?: Record<string, string>;
  ownerAccountId?: string;
}

export interface AgentContext {
  accounts: CommentAccount[];
  cafes: AgentCafe[];
}

export interface BrokerClient {
  claim: () => Promise<BrokerJob | null>;
  heartbeat: (jobId: string) => Promise<boolean>;
  report: (jobId: string, payload: AgentCompletePayload) => Promise<boolean>;
  accounts: (scope?: 'commenter' | 'all') => Promise<CommentAccount[]>;
  pool: (
    jobId: string,
    ownerNickname: string,
    needed: number,
    reusableAccountIds?: string[],
  ) => Promise<CommentAccount[]>;
  plan: (jobId: string, article: AgentArticleSnapshot) => Promise<AgentCommentPlan>;
  context: () => Promise<AgentContext>;
  sync: (operation: string, payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
  prepare: (operation: string, payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
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

  const accounts = async (scope: 'commenter' | 'all' = 'commenter'): Promise<CommentAccount[]> => {
    const data = await post('/api/agent/accounts', { scope });
    return (data.accounts as CommentAccount[]) ?? [];
  };

  const pool = async (
    jobId: string,
    ownerNickname: string,
    needed: number,
    reusableAccountIds: string[] = [],
  ): Promise<CommentAccount[]> => {
    const data = await post('/api/agent/pool', { jobId, ownerNickname, needed, reusableAccountIds });
    return (data.pool as CommentAccount[]) ?? [];
  };

  const plan = async (jobId: string, article: AgentArticleSnapshot): Promise<AgentCommentPlan> => {
    const data = await post('/api/agent/plan', { jobId, article });
    return {
      comments: Array.isArray(data.comments) ? data.comments.map(String) : [],
      summary: typeof data.summary === 'string' ? data.summary : undefined,
    };
  };

  const context = async (): Promise<AgentContext> => {
    const data = await post('/api/agent/context', {});
    return {
      accounts: (data.accounts as CommentAccount[]) ?? [],
      cafes: (data.cafes as AgentCafe[]) ?? [],
    };
  };

  const sync = async (
    operation: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> => post('/api/agent/sync', { operation, payload });

  const prepare = async (
    operation: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> => post('/api/agent/prepare', { operation, payload });

  return { claim, heartbeat, report, accounts, pool, plan, context, sync, prepare };
};
