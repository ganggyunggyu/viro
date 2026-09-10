import { NextResponse } from 'next/server';
import { withManagementAuth, readManagementBody } from '@/shared/lib/agent-management/route';
import { objectBody, textField } from '@/shared/lib/agent-management/contract';
import { claimActionById } from '@/shared/lib/agent-management/action-store';

export const runtime = 'nodejs';

export const POST = withManagementAuth<{ params: Promise<{ taskId: string }> }>(async ({ userId, tokenId }, request, { params }) => {
  const { taskId } = await params;
  const body = objectBody(await readManagementBody(request), ['workerId']);
  const task = await claimActionById(userId, tokenId, textField(body.workerId, 'workerId', 128), taskId);
  return NextResponse.json({ task }, { headers: { 'Cache-Control': 'private, no-store' } });
});
