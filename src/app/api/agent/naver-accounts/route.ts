import { NextResponse } from 'next/server';
import { withManagementAuth, readManagementBody } from '@/shared/lib/agent-management/route';
import { listAgentAccounts, registerAgentAccount } from '@/shared/lib/agent-management/registrations';

export const runtime = 'nodejs';

export const GET = withManagementAuth(async ({ userId }) => {
  const accounts = await listAgentAccounts(userId);
  return NextResponse.json({ accounts, count: accounts.length });
});

export const POST = withManagementAuth(async ({ userId }, request) => {
  const account = await registerAgentAccount(userId, await readManagementBody(request));
  return NextResponse.json({ success: true, account }, { status: 201 });
});
