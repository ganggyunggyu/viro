import dotenv from 'dotenv';
import { closeAllQueues } from '../src/shared/lib/queue';
import { closeAllWorkers, startAllTaskWorkers } from '../src/shared/lib/queue/workers';
import { connectDB } from '../src/shared/lib/mongodb';
import { closeAllContexts } from '../src/shared/lib/multi-session';

dotenv.config({ path: '.env.local' });

const main = async (): Promise<void> => {
  await connectDB();
  await startAllTaskWorkers();

  console.log('[TASK-WORKER] running');
  console.log(`[TASK-WORKER] TASK_WORKER_CONCURRENCY=${process.env.TASK_WORKER_CONCURRENCY || '1'}`);
  console.log(`[TASK-WORKER] PLAYWRIGHT_HEADLESS=${process.env.PLAYWRIGHT_HEADLESS || ''}`);
};

const shutdown = async (): Promise<void> => {
  console.log('[TASK-WORKER] shutdown');
  try {
    await closeAllWorkers();
  } catch {}
  try {
    await closeAllQueues();
  } catch {}
  try {
    await closeAllContexts();
  } catch {}
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

main().catch((error) => {
  console.error('[TASK-WORKER] failed:', error);
  process.exit(1);
});
