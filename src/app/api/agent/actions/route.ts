import { NextResponse } from 'next/server';
import { withManagementAuth, readManagementBody } from '@/shared/lib/agent-management/route';
import { enqueueAction, readActions } from '@/shared/lib/agent-management/action-store';
export const runtime = 'nodejs';
export const POST = withManagementAuth(async ({ userId }, request) => {
  const result = await enqueueAction(userId, request.headers.get('Idempotency-Key'), await readManagementBody(request, 512000));
  return NextResponse.json({ success: true, ...result }, { status: 202 });
});
export const GET = withManagementAuth(async ({ userId }, request) => {
  const id = new URL(request.url).searchParams.get('id') || undefined;
  return NextResponse.json({ tasks: await readActions(userId, id) }, { headers: { 'Cache-Control': 'no-store' } });
});
