import { NextResponse } from 'next/server';
import { withManagementAuth, readManagementBody } from '@/shared/lib/agent-management/route';
import { objectBody, textField, parseOperationId } from '@/shared/lib/agent-management/contract';
import { heartbeatAgentOperation } from '@/shared/lib/agent-management/operations';

export const runtime = 'nodejs';

export const POST = withManagementAuth(async ({ userId, tokenId }, request) => {
  const body = objectBody(await readManagementBody(request), ['workerId', 'operationId']);
  const ok = await heartbeatAgentOperation(userId, tokenId, textField(body.workerId, 'workerId', 128), body.operationId === undefined ? undefined : parseOperationId(body.operationId));
  return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
});
