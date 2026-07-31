import type { JobOutcome, JobResult } from './types';

export const resolveJobOutcome = ({
  outcome,
  requeued,
  softFailed,
  skipped,
  success,
  willRetry,
}: JobResult): JobOutcome => {
  if (outcome) return outcome;
  if (requeued || willRetry) return 'requeued';
  if (softFailed || !success) return 'soft-failed';
  if (skipped) return 'skipped';
  return 'completed';
};

export const annotateJobResult = (result: JobResult): JobResult => {
  const outcome = resolveJobOutcome(result);

  return {
    ...result,
    outcome,
    requeued: outcome === 'requeued' || undefined,
    softFailed: outcome === 'soft-failed' || undefined,
  };
};
