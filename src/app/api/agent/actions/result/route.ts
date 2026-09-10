import { NextResponse } from 'next/server';
import { withManagementAuth, readManagementBody } from '@/shared/lib/agent-management/route';
import { finishAction } from '@/shared/lib/agent-management/action-store';
import { safeActionResult } from '@/shared/lib/agent-management/action-result';
import { objectBody, textField, AgentManagementError } from '@/shared/lib/agent-management/contract';
export const runtime = 'nodejs';
export const POST = withManagementAuth(async ({ userId, tokenId }, request) => {
  const body = objectBody(await readManagementBody(request, 512000), ['workerId', 'taskId', 'result', 'uncertain']);
  if (typeof body.uncertain !== 'boolean') throw new AgentManagementError('확인 상태가 올바르지 않습니다');
  const ok = await finishAction(userId, tokenId, textField(body.workerId, 'workerId', 128), textField(body.taskId, 'taskId', 64), safeActionResult(body.result), body.uncertain);
  return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
});
