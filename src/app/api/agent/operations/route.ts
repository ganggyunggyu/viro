import { NextResponse } from 'next/server';
import { withManagementAuth, readManagementBody } from '@/shared/lib/agent-management/route';
import { enqueueAgentOperation, listAgentOperations } from '@/shared/lib/agent-management/operations';

export const runtime = 'nodejs';

export const POST = withManagementAuth(async ({ userId }, request) => {
  const result = await enqueueAgentOperation(userId, request.headers.get('Idempotency-Key'), await readManagementBody(request));
  return NextResponse.json({ success: true, ...result }, { status: 202 });
});

export const GET = withManagementAuth(async ({ userId }, request) => {
  const operations = await listAgentOperations(userId, new URL(request.url).searchParams.get('limit'));
  return NextResponse.json({ operations, count: operations.length });
});
