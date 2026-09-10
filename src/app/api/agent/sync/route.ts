import { NextResponse } from 'next/server';
import { authenticateAgentToken, getBearerToken } from '@/shared/lib/agent-broker';
import { syncBrokerTask } from '@/shared/lib/agent-scheduler/broker-sync';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  const identity = await authenticateAgentToken(getBearerToken(request));
  if (!identity) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const operation = String(body.operation || '');
  const payload = body.payload && typeof body.payload === 'object'
    ? body.payload as Record<string, unknown>
    : {};

  try {
    const result = await syncBrokerTask(identity.userId, operation, payload);

    if (!result) {
      return NextResponse.json({ error: 'unsupported operation' }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'sync failed' },
      { status: 400 },
    );
  }
};
