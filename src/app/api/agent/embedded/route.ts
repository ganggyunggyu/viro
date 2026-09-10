import { NextResponse } from 'next/server';
import { withManagementAuth } from '@/shared/lib/agent-management/route';

export const runtime = 'nodejs';

export const GET = withManagementAuth(async () => NextResponse.json({
  protocol: 'viro-embedded-worker/1', claimById: true,
}, { headers: { 'Cache-Control': 'private, no-store' } }));
