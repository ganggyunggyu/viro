import { NextResponse } from 'next/server';
import { authenticateAgentToken, heartbeatJob, getBearerToken } from '@/shared/lib/agent-broker';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  const identity = await authenticateAgentToken(getBearerToken(request));

  if (!identity) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const jobId = String(body.jobId || '');
  const workerId = String(body.workerId || `agent-${identity.tokenId}`);

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const alive = await heartbeatJob(jobId, identity.userId, workerId);

  return NextResponse.json({ ok: alive });
};
