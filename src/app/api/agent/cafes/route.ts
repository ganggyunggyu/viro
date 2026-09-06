import { NextResponse } from 'next/server';
import { withAgentAuth } from '@/shared/lib/agent-broker/route-auth';
import { getAllCafes } from '@/shared/config/cafes';
import { withManagementAuth, readManagementBody } from '@/shared/lib/agent-management/route';
import { registerAgentCafe } from '@/shared/lib/agent-management/registrations';

export const runtime = 'nodejs';

export const GET = withAgentAuth(async ({ userId }) => {
  const cafes = await getAllCafes(userId);
  return NextResponse.json({ cafes, count: cafes.length });
});

export const POST = withManagementAuth(async ({ userId }, request) => {
  const cafe = await registerAgentCafe(userId, await readManagementBody(request));
  return NextResponse.json({ success: true, cafe }, { status: 201 });
});
