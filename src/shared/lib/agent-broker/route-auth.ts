/**
 * 에이전트 라우트 공통 인증. 라우트마다 같은 401 분기를 다시 쓰지 않도록 감싼다.
 */
import { NextResponse } from 'next/server';
import { authenticateAgentToken, getBearerToken, type AgentIdentity } from './index';

type Handler<T> = (identity: AgentIdentity, request: Request, context: T) => Promise<Response>;

export const withAgentAuth = <T>(handler: Handler<T>) =>
  async (request: Request, context: T): Promise<Response> => {
    const identity = await authenticateAgentToken(getBearerToken(request));
    if (!identity) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    try {
      return await handler(identity, request, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'request failed';
      console.error('[AGENT API] 실패:', message);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  };
