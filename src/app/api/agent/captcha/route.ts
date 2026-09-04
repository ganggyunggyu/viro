import { NextResponse } from 'next/server';
import { withAgentAuth } from '@/shared/lib/agent-broker/route-auth';
import { solveCaptchaViaScheduler, type CaptchaKind } from '@/shared/lib/captcha-client';

export const runtime = 'nodejs';

const toKind = (value: unknown): CaptchaKind =>
  value === 'login' || value === 'cafe-join' ? value : 'cafe-create';

/**
 * 데스크톱 에이전트가 부르는 창구. 실제 풀이는 스케쥴러가 한다.
 * accountId 는 더 이상 필요 없다 — 계정별 AI 키를 보지 않기 때문이다.
 */
export const POST = withAgentAuth(async (_identity, request) => {
  const body = await request.json().catch(() => ({}));
  const image = typeof body.image === 'string' ? body.image : '';
  if (!image) {
    return NextResponse.json({ error: 'image required' }, { status: 400 });
  }

  const answer = await solveCaptchaViaScheduler({
    image,
    kind: toKind(body.kind),
    question: typeof body.question === 'string' ? body.question : undefined,
  });
  return NextResponse.json({ answer });
});
