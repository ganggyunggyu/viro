import { NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/mongodb';
import { User, AgentToken } from '@/shared/models';
import { isHashedPassword, verifyPassword } from '@/shared/lib/password';
import { generateAgentToken, hashAgentToken } from '@/shared/lib/agent-broker';

export const runtime = 'nodejs';

// 데스크톱 프로그램이 토큰 붙여넣기 대신 VIRO 아이디/비밀번호로 로그인한다.
// 웹 로그인과 동일하게 자격증명을 검증하고, 성공하면 그 userId 로 에이전트 토큰을 발급해
// 돌려준다. 데스크톱은 이 토큰만 저장하며 비밀번호는 서버에도 이 PC에도 남기지 않는다.
export const POST = async (request: Request): Promise<Response> => {
  const body = await request.json().catch(() => ({}));
  const loginId = typeof body.loginId === 'string' ? body.loginId.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!loginId || !password) {
    return NextResponse.json({ error: '아이디와 비밀번호를 입력하세요' }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await User.findOne({ loginId, isActive: true });
    if (!user) {
      return NextResponse.json({ error: '존재하지 않는 아이디' }, { status: 401 });
    }

    const passwordMatches = isHashedPassword(user.password)
      ? verifyPassword(password, user.password)
      : user.password === password;
    if (!passwordMatches) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다' }, { status: 401 });
    }

    const rawToken = generateAgentToken();
    await AgentToken.create({
      userId: user.userId,
      tokenHash: hashAgentToken(rawToken),
      label: `desktop-login ${new Date().toISOString().slice(0, 10)}`,
    });

    return NextResponse.json({ token: rawToken, displayName: user.displayName });
  } catch (error) {
    console.error('[AGENT LOGIN] 실패:', error);
    return NextResponse.json({ error: '로그인 처리 중 오류 발생' }, { status: 500 });
  }
};
