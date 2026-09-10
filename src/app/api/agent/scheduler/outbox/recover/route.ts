import { withSchedulerAuth } from '@/shared/lib/agent-scheduler/route';
import { recoverSchedulerOutbox } from '@/shared/lib/agent-scheduler/outbox-store';
import { objectBody } from '@/shared/lib/agent-management/contract';
import { taskError } from '@/shared/lib/agent-scheduler/task-contract';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const POST = withSchedulerAuth(async (input) => {
  const body = objectBody(input, ['limit']);
  if (body.limit !== undefined && (!Number.isInteger(body.limit) || Number(body.limit) < 1 || Number(body.limit) > 100)) return taskError('invalid_limit', 400);
  return recoverSchedulerOutbox(body.limit === undefined ? 50 : Number(body.limit));
});
