import { NextResponse } from 'next/server';
import { withManagementAuth } from '@/shared/lib/agent-management/route';
import { getAgentOperation } from '@/shared/lib/agent-management/operations';

export const runtime = 'nodejs';

export const GET = withManagementAuth<{ params: Promise<{ operationId: string }> }>(async ({ userId }, _request, { params }) => {
  const { operationId } = await params;
  return NextResponse.json({ operation: await getAgentOperation(userId, operationId) });
});
