import { NextResponse } from 'next/server';
import { withManagementAuth, readManagementBody } from '@/shared/lib/agent-management/route';
import { objectBody, textField } from '@/shared/lib/agent-management/contract';
import { claimAgentOperation } from '@/shared/lib/agent-management/operations';

export const runtime = 'nodejs';

export const POST = withManagementAuth(async ({ userId, tokenId }, request) => {
  const body = objectBody(await readManagementBody(request), ['workerId']);
  const claimed = await claimAgentOperation(userId, tokenId, textField(body.workerId, 'workerId', 128));
  return NextResponse.json({ claimed });
});
