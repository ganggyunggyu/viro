import { NextResponse } from 'next/server';
import { withManagementAuth, readManagementBody } from '@/shared/lib/agent-management/route';
import { objectBody, textField } from '@/shared/lib/agent-management/contract';
import { claimAgentOperationById } from '@/shared/lib/agent-management/operations';

export const runtime = 'nodejs';

export const POST = withManagementAuth<{ params: Promise<{ operationId: string }> }>(async ({ userId, tokenId }, request, { params }) => {
  const { operationId } = await params;
  const body = objectBody(await readManagementBody(request), ['workerId']);
  const claimed = await claimAgentOperationById(userId, tokenId, textField(body.workerId, 'workerId', 128), operationId);
  return NextResponse.json({ claimed }, { headers: { 'Cache-Control': 'private, no-store' } });
});
