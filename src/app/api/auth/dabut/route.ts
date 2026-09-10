import { NextResponse } from 'next/server';
import { connectDabutAccount, isAuthError } from '@/shared/lib/dabut-auth';
import { readManagementBody } from '@/shared/lib/agent-management/route';
import { AgentManagementError } from '@/shared/lib/agent-management/contract';
import { DABUT_COOKIE_NAME, serviceCookieOptions } from '@/shared/lib/dabut-auth/cookie';

export const runtime = 'nodejs';
export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await readManagementBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: '로그인 요청을 확인하세요.' }, { status: 400 });
    }
    const { token, legacyLoginId, legacyPassword } = body as Record<string, unknown>;
    if (typeof token !== 'string'
      || (legacyLoginId !== undefined && typeof legacyLoginId !== 'string')
      || (legacyPassword !== undefined && typeof legacyPassword !== 'string')) {
      return NextResponse.json({ error: '로그인 요청을 확인하세요.' }, { status: 400 });
    }
    const result = await connectDabutAccount({ token, legacyLoginId, legacyPassword });
    const response = NextResponse.json({ token: result.token, userId: result.userId, dabutUserId: result.dabutUserId, displayName: result.displayName },
      { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(DABUT_COOKIE_NAME, result.token, serviceCookieOptions(result.expiresAt));
    return response;
  } catch (error) {
    if (isAuthError(error) || error instanceof AgentManagementError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: '로그인 연결을 완료하지 못했습니다.', code: 'service_unavailable' }, { status: 503 });
  }
};
