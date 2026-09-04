import { NextResponse } from 'next/server';
import { withAgentAuth } from '@/shared/lib/agent-broker/route-auth';
import { listManualCommentJobs } from '@/features/manual-comment-job/job-queries';

export const runtime = 'nodejs';

export const GET = withAgentAuth(async ({ userId }, request) => {
  const { searchParams } = new URL(request.url);
  const jobs = await listManualCommentJobs(userId, {
    status: searchParams.get('status') ?? undefined,
    cafeId: searchParams.get('cafeId') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });
  return NextResponse.json({ jobs, count: jobs.length });
});
