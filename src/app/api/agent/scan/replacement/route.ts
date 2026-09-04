import { NextResponse } from 'next/server';
import { withAgentAuth } from '@/shared/lib/agent-broker/route-auth';
import {
  scanCommentReplacementCandidates,
  type ScanCommentReplacementOptions,
} from '@/features/manual-comment-job/comment-replacement-scan';

export const runtime = 'nodejs';

/** 후보만 돌려준다. 큐에 넣는 것은 /scan/replacement/queue 다. */
export const POST = withAgentAuth(async ({ userId }, request) => {
  const body = await request.json().catch(() => ({}));
  const cafeIds = Array.isArray(body.cafeIds) ? body.cafeIds.map(String).filter(Boolean) : [];
  if (!cafeIds.length) {
    return NextResponse.json({ error: 'cafeIds required' }, { status: 400 });
  }

  const result = await scanCommentReplacementCandidates(userId, {
    ...(body as ScanCommentReplacementOptions),
    cafeIds,
  });
  return NextResponse.json(result);
});
