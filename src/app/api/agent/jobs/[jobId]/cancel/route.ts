import { NextResponse } from 'next/server';
import { withAgentAuth } from '@/shared/lib/agent-broker/route-auth';
import { cancelManualCommentJob } from '@/features/manual-comment-job/job-queries';

export const runtime = 'nodejs';

type Context = { params: Promise<{ jobId: string }> };

export const POST = withAgentAuth<Context>(async ({ userId }, _request, { params }) => {
  const { jobId } = await params;
  const result = await cancelManualCommentJob(userId, jobId);

  if (result.ok) {
    return NextResponse.json({ job: result.job });
  }
  if (result.reason === 'not-found') {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }
  // 이미 워커가 집어간 뒤다. 되돌릴 수 없다는 것을 상태와 함께 알린다.
  return NextResponse.json(
    { error: 'job is not cancellable', status: result.status },
    { status: 409 },
  );
});
