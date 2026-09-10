import { actionCapabilities } from '@/shared/lib/agent-management/action-capabilities';
import { managementCapabilities } from '@/shared/lib/agent-management/capabilities';
import { NextResponse } from 'next/server';
import { withManagementAuth } from '@/shared/lib/agent-management/route';
import { schedulerExecutionStatus } from '@/shared/lib/agent-scheduler/worker';

export const runtime = 'nodejs';

export const GET = withManagementAuth(async () => NextResponse.json({
  version: '2', service: 'viro', authentication: { mode: 'login', path: '/api/agent/login' },
  execution: await schedulerExecutionStatus(),
  capabilities: [...managementCapabilities, ...actionCapabilities],
}, { headers: { 'Cache-Control': 'private, no-store' } }));
