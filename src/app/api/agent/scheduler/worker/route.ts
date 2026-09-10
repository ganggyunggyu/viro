import { withSchedulerAuth } from '@/shared/lib/agent-scheduler/route';
import { touchSchedulerWorker } from '@/shared/lib/agent-scheduler/worker';
import { objectBody } from '@/shared/lib/agent-management/contract';

export const runtime = 'nodejs';
export const POST = withSchedulerAuth(async (input) => {
  const body = objectBody(input, ['workerId']);
  return touchSchedulerWorker(body.workerId);
});
