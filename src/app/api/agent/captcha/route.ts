import { NextResponse } from 'next/server';
import { authenticateAgentToken, getBearerToken } from '@/shared/lib/agent-broker';
import { solveCafeCreateCaptchaImage } from '@/shared/lib/naver-cafe-creation';
import { solveCafeJoinCaptchaImage } from '@/shared/lib/naver-cafe-membership';
import { solveLoginCaptchaImage } from '@/shared/lib/captcha-solver';
import type { CaptchaKind } from '@/shared/lib/captcha-broker';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  const identity = await authenticateAgentToken(getBearerToken(request));
  if (!identity) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const image = typeof body.image === 'string' ? body.image : '';
  const question = typeof body.question === 'string' ? body.question : '';
  const kind: CaptchaKind =
    body.kind === 'login' || body.kind === 'cafe-join' || body.kind === 'cafe-create'
      ? body.kind
      : 'cafe-create';
  if (!image) {
    return NextResponse.json({ error: 'image required' }, { status: 400 });
  }

  try {
    const answer = kind === 'login'
      ? (await solveLoginCaptchaImage(image, question)).answer
      : kind === 'cafe-join'
        ? await solveCafeJoinCaptchaImage(image)
        : await solveCafeCreateCaptchaImage(image);
    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'captcha failed' },
      { status: 500 },
    );
  }
};
