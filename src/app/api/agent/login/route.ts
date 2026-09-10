import { NextResponse } from 'next/server';
import { AgentToken } from '@/shared/models/agent-token';
import { generateAgentToken, hashAgentToken } from '@/shared/lib/agent-broker/auth';
import { loginWithCredentials } from '@/shared/lib/agent-management/login-store';
import { readManagementBody } from '@/shared/lib/agent-management/route';
import { AgentManagementError } from '@/shared/lib/agent-management/contract';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await readManagementBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: '아이디와 비밀번호를 입력하세요' }, { status: 400 });
    }
    const { loginId, password } = body as Record<string, unknown>;
    const user = await loginWithCredentials(loginId, password);
    if (!user) return NextResponse.json({ error: '아이디 또는 비밀번호를 확인하세요' }, { status: 401 });
    const token = generateAgentToken();
    await AgentToken.create({ userId: user.userId, tokenHash: hashAgentToken(token), label: 'desktop-login' });
    return NextResponse.json({ token, displayName: user.displayName }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AgentManagementError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('[AGENT LOGIN] 로그인 처리 실패');
    return NextResponse.json({ error: '로그인 처리 중 오류 발생' }, { status: 503 });
  }
};
