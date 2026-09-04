import { NextResponse } from 'next/server';
import { withAgentAuth } from '@/shared/lib/agent-broker/route-auth';
import {
  scanLowCommentArticles,
  type ScanLowCommentArticlesOptions,
} from '@/features/manual-comment-job/low-comment-scan';

export const runtime = 'nodejs';

// 스캔만 하는 것이 아니라 찾은 글에 댓글 작업을 큐에 넣는다. 그래서 GET 이 아니다.
export const POST = withAgentAuth(async ({ userId }, request) => {
  const body = await request.json().catch(() => ({}));
  const result = await scanLowCommentArticles(userId, body as ScanLowCommentArticlesOptions);
  return NextResponse.json(result);
});
