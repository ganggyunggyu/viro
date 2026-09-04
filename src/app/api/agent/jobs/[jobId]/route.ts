import { NextResponse } from 'next/server';
import { withAgentAuth } from '@/shared/lib/agent-broker/route-auth';
import { getManualCommentJob } from '@/features/manual-comment-job/job-queries';

export const runtime = 'nodejs';

type Context = { params: Promise<{ jobId: string }> };

export const GET = withAgentAuth<Context>(async ({ userId }, _request, { params }) => {
  const { jobId } = await params;
  const job = await getManualCommentJob(userId, jobId);
  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }
  return NextResponse.json({ job });
});
