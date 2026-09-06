import { NextResponse } from 'next/server';
import { withManagementAuth, readManagementBody } from '@/shared/lib/agent-management/route';
import { objectBody, textField, parseOperationId, parseOperationResult } from '@/shared/lib/agent-management/contract';
import { finishAgentOperation } from '@/shared/lib/agent-management/operations';

export const runtime = 'nodejs';

export const POST = withManagementAuth(async ({ userId, tokenId }, request) => {
  const body = objectBody(await readManagementBody(request), ['workerId', 'operationId', 'result']);
  const ok = await finishAgentOperation(userId, tokenId, textField(body.workerId, 'workerId', 128), parseOperationId(body.operationId), parseOperationResult(body.result));
  return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
});
