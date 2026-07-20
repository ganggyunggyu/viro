import { NextResponse } from 'next/server';
import { authenticateAgentToken, getBearerToken } from '@/shared/lib/agent-broker';
import { solveCafeCreateCaptchaImage } from '@/shared/lib/naver-cafe-creation';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  const identity = await authenticateAgentToken(getBearerToken(request));
  if (!identity) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const image = typeof body.image === 'string' ? body.image : '';
  if (!image) {
    return NextResponse.json({ error: 'image required' }, { status: 400 });
  }

  try {
    const answer = await solveCafeCreateCaptchaImage(image);
    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'captcha failed' },
      { status: 500 },
    );
  }
};
