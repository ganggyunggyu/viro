import { connectDB } from '@/shared/lib/mongodb';
import { WorkerHeartbeat, touchWorkerHeartbeat } from '@/shared/models/worker-heartbeat';
import { parseWorkerId } from '@/shared/lib/agent-scheduler/task-contract';
import { hasSchedulerDispatchConfig } from '@/shared/lib/agent-scheduler/outbox';

const KIND = 'viro-scheduler-v1';
export const touchSchedulerWorker = async (workerId: unknown): Promise<{ ok: true }> => {
  const id = parseWorkerId(workerId);
  await connectDB();
  await touchWorkerHeartbeat({ workerId: `${KIND}:${id}`, kind: KIND, label: 'Viro scheduler' });
  return { ok: true };
};
export const schedulerExecutionStatus = async () => {
  await connectDB();
  const online = Boolean(await WorkerHeartbeat.exists({ kind: KIND, lastSeenAt: { $gte: new Date(Date.now() - 120_000) } }));
  const accepting = hasSchedulerDispatchConfig(process.env.VIRO_SCHEDULER_URL, process.env.VIRO_SCHEDULER_SERVICE_SECRET);
  return { mode: 'scheduler' as const, accepting, operationWorkerOnline: online, actionWorkerOnline: online };
};
