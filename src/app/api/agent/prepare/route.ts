import { NextResponse } from 'next/server';
import { authenticateAgentToken, getBearerToken } from '@/shared/lib/agent-broker';
import { prepareBrokerTask } from '@/shared/lib/agent-scheduler/broker-prepare';

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
    const result = await prepareBrokerTask(identity.userId, operation, payload);
    return NextResponse.json(result, { status: result.success === false ? 400 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'prepare failed';
    console.error('[AGENT PREPARE] 실패:', message);
    return NextResponse.json({ error: message }, { status: message === 'unsupported operation' ? 400 : message === 'cafe not found' ? 404 : 502 });
  }
};
