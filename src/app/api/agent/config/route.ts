import { NextResponse } from 'next/server';
import { authenticateAgentToken, getBearerToken } from '@/shared/lib/agent-broker';

export const runtime = 'nodejs';

// 데스크톱 에이전트가 로컬 캡차 자동 풀이에 쓰는 Gemini 키를 인증된 토큰에게만 내려준다.
// 키는 서버 환경변수(Vercel)에만 저장되고, 계정 비밀번호(context)와 동일한 신뢰 경계로 전달된다.
export const POST = async (request: Request): Promise<Response> => {
  const identity = await authenticateAgentToken(getBearerToken(request));
  if (!identity) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const geminiApiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    '';

  return NextResponse.json({ geminiApiKey });
};
