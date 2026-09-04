import { NextResponse } from 'next/server';
import { withAgentAuth } from '@/shared/lib/agent-broker/route-auth';
import { getAllCafes } from '@/shared/config/cafes';

export const runtime = 'nodejs';

export const GET = withAgentAuth(async ({ userId }) => {
  const cafes = await getAllCafes(userId);
  return NextResponse.json({ cafes, count: cafes.length });
});
