import { NextResponse } from 'next/server';
import { withManagementAuth, readManagementBody } from '@/shared/lib/agent-management/route';
import { claimAction } from '@/shared/lib/agent-management/action-store';
import { objectBody, textField } from '@/shared/lib/agent-management/contract';
export const runtime = 'nodejs';
export const POST = withManagementAuth(async ({ userId, tokenId }, request) => {
  const body = objectBody(await readManagementBody(request), ['workerId', 'taskId']);
  const task = await claimAction(userId, tokenId, textField(body.workerId, 'workerId', 128));
  return NextResponse.json({ task });
});
