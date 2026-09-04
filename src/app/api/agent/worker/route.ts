import { NextResponse } from 'next/server';
import { withAgentAuth } from '@/shared/lib/agent-broker/route-auth';
import { getCommentWorkerStatus } from '@/features/manual-comment-job/worker-status';

export const runtime = 'nodejs';

export const GET = withAgentAuth(async ({ userId }) =>
  NextResponse.json(await getCommentWorkerStatus(userId)));
