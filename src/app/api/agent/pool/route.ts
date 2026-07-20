import { NextResponse } from 'next/server';
import { authenticateAgentToken, getJobAccountPool, getBearerToken } from '@/shared/lib/agent-broker';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  const identity = await authenticateAgentToken(getBearerToken(request));

  if (!identity) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const jobId = String(body.jobId || '');
  const ownerNickname = String(body.ownerNickname || '');
  const needed = Number(body.needed || 1);

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const pool = await getJobAccountPool(identity.userId, jobId, ownerNickname, needed);

  if (!pool) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }

  return NextResponse.json({ pool });
};
