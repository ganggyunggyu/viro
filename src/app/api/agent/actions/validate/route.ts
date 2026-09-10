import { NextResponse } from 'next/server';
import { withManagementAuth, readManagementBody } from '@/shared/lib/agent-management/route';
import { prepareAction } from '@/shared/lib/agent-management/action-store';
export const runtime = 'nodejs';
export const POST = withManagementAuth(async ({ userId }, request) => NextResponse.json({
  action: await prepareAction(userId, await readManagementBody(request, 512000)),
}));
