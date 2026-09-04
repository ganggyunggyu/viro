import { NextResponse } from 'next/server';
import { withAgentAuth } from '@/shared/lib/agent-broker/route-auth';
import {
  queueCommentReplacementJobs,
  type CommentReplacementCandidate,
} from '@/features/manual-comment-job/comment-replacement-scan';
import type { CafeCommentStyle } from '@/shared/api/cafe-comment-style';

export const runtime = 'nodejs';

export const POST = withAgentAuth(async ({ userId }, request) => {
  const body = await request.json().catch(() => ({}));
  const candidates = Array.isArray(body.candidates)
    ? (body.candidates as CommentReplacementCandidate[])
    : [];
  if (!candidates.length) {
    return NextResponse.json({ error: 'candidates required' }, { status: 400 });
  }

  const result = await queueCommentReplacementJobs(
    userId,
    candidates,
    body.commentStyle as CafeCommentStyle | undefined,
  );
  return NextResponse.json(result);
});
