import { NextResponse } from 'next/server';
import {
  authenticateAgentToken,
  getActiveAccounts,
  getActiveCommenterAccounts,
  getBearerToken,
} from '@/shared/lib/agent-broker';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  const identity = await authenticateAgentToken(getBearerToken(request));

  if (!identity) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const accounts = body.scope === 'all'
    ? await getActiveAccounts(identity.userId)
    : await getActiveCommenterAccounts(identity.userId);

  return NextResponse.json({ accounts });
};
