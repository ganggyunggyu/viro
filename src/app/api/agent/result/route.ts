import { NextResponse } from 'next/server';
import { authenticateAgentToken, completeJob, getBearerToken, type CompleteJobInput } from '@/shared/lib/agent-broker';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  const identity = await authenticateAgentToken(getBearerToken(request));

  if (!identity) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const jobId = String(body.jobId || '');
  const status = body.status === 'failed' ? 'failed' : 'done';

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const input: CompleteJobInput = {
    status,
    results: Array.isArray(body.results) ? body.results : undefined,
    deleteResults: Array.isArray(body.deleteResults) ? body.deleteResults : undefined,
    errorMessage: typeof body.errorMessage === 'string' ? body.errorMessage : undefined,
    agentSummary: typeof body.agentSummary === 'string' ? body.agentSummary : undefined,
  };

  const updated = await completeJob(jobId, identity.userId, input);

  return NextResponse.json({ ok: updated });
};
