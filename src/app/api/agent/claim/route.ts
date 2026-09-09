import { NextResponse } from 'next/server';
import { authenticateAgentToken, claimJobForUser, getBearerToken } from '@/shared/lib/agent-broker';
import { touchManualCommentWorkerHeartbeat } from '@/shared/lib/agent-broker/manual-worker-heartbeat';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  const identity = await authenticateAgentToken(getBearerToken(request));

  if (!identity) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const workerId = String(body.workerId || `agent-${identity.tokenId}`);
  await touchManualCommentWorkerHeartbeat({ ...identity, workerId });
  const job = await claimJobForUser(identity.userId, workerId);

  return NextResponse.json({ job: job ?? null });
};
