import { NextResponse } from 'next/server';
import { authenticateAgentToken, getBearerToken, type AgentIdentity } from '@/shared/lib/agent-broker';
import { AgentManagementError } from '@/shared/lib/agent-management/contract';

export const readManagementBody = async (request: Request): Promise<unknown> => {
  const body = await request.text();
  if (body.length > 16_384) throw new AgentManagementError('요청이 너무 큽니다', 413, 'request_too_large');
  try { return JSON.parse(body); } catch { throw new AgentManagementError('JSON 요청이 올바르지 않습니다'); }
};

export const withManagementAuth = <T>(handler: (identity: AgentIdentity, request: Request, context: T) => Promise<Response>) =>
  async (request: Request, context: T): Promise<Response> => {
    try {
      const identity = await authenticateAgentToken(getBearerToken(request));
      if (!identity) return NextResponse.json({ error: 'unauthorized', code: 'unauthorized' }, { status: 401 });
      return await handler(identity, request, context);
    } catch (error) {
      if (error instanceof AgentManagementError) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
      }
      // Raw database and validation errors can contain request passwords. Never serialize them.
      console.error('[AGENT MANAGEMENT] 요청 처리 실패');
      return NextResponse.json({ error: '요청 처리 중 오류가 발생했습니다', code: 'service_unavailable' }, { status: 503 });
    }
  };
