import { withSchedulerAuth } from '@/shared/lib/agent-scheduler/route';
import { runSchedulerTask } from '@/shared/lib/agent-scheduler/task-service';
import { schedulerTaskDependencies } from '@/shared/lib/agent-scheduler/task-dependencies';
import { parseTaskBody, parseTaskReference, parseWorkerId, taskError, type SchedulerVerb } from '@/shared/lib/agent-scheduler/task-contract';
import { abortSchedulerTask } from '@/shared/lib/agent-scheduler/abort';

export const runtime = 'nodejs';
export const maxDuration = 120;
type Context = { params: Promise<{ kind: string; id: string; verb: string }> };
export const POST = withSchedulerAuth<Context>(async (input, { params }) => {
  const { kind, id, verb } = await params;
  const body = parseTaskBody(verb, input);
  const ref = parseTaskReference(kind, id, body.dispatchId);
  if (verb === 'abort') {
    if (body.code !== 'preparation_failed' && body.code !== 'execution_uncertain') return taskError('invalid_code', 400);
    return abortSchedulerTask(ref, parseWorkerId(body.workerId), body.code);
  }
  return runSchedulerTask(schedulerTaskDependencies, ref, verb as SchedulerVerb, body);
});
