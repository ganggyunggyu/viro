import type { CafeConfig } from '@/shared/config/cafe-types';
import { actionResources } from '@/shared/lib/agent-management/action-contract';
import type { SchedulerTask } from '@/shared/lib/agent-scheduler/task-contract';
import { assertTaskPrepare } from '@/shared/lib/agent-scheduler/task-scope-prepare';
import { assertTaskSync } from '@/shared/lib/agent-scheduler/task-scope-sync';
import { denyTaskScope, isEligibleWriter, requireTaskScope, type TaskAccount, type TaskContext } from '@/shared/lib/agent-scheduler/task-scope-payload';

export type { TaskAccount, TaskContext } from '@/shared/lib/agent-scheduler/task-scope-payload';

/** Input resources must already have been loaded using the stored task.userId. */
export const selectTaskContext = <A extends TaskAccount, C extends CafeConfig>(
  task: SchedulerTask,
  context: { accounts: A[]; cafes: C[] },
): { accounts: A[]; cafes: C[] } => {
  if (task.kind === 'operation') {
    const { operation } = task;
    requireTaskScope(operation);
    return {
      accounts: context.accounts.filter(({ accountId }) => accountId === operation.accountId),
      cafes: context.cafes.filter(({ cafeId }) => cafeId === operation.cafeId),
    };
  }
  const { action } = task;
  requireTaskScope(action);
  const { accountIds, cafeIds } = actionResources(action);
  let accounts = accountIds.length ? context.accounts.filter(({ accountId }) => accountIds.includes(accountId)) : context.accounts;
  let cafes = cafeIds.length ? context.cafes.filter(({ cafeId }) => cafeIds.includes(cafeId)) : context.cafes;
  if (action.type === 'account-login' || action.type === 'cafe-create') cafes = [];
  if (action.type === 'manual-publish' || action.type === 'manual-modify') {
    cafes = context.cafes.filter(({ cafeId }) => cafeId === action.input.cafeId);
    if (action.type === 'manual-publish') accounts = accounts.filter((account) => cafes.some((cafe) => isEligibleWriter(account, cafe)));
  }
  if (action.type === 'rewrite') accounts = accounts.filter(({ accountId }) => cafes.some(({ ownerAccountId }) => ownerAccountId === accountId));
  return { accounts, cafes };
};

export const assertTaskBrokerPayload = (
  task: SchedulerTask,
  verb: 'sync' | 'prepare',
  operation: string,
  payload: Record<string, unknown>,
  context: TaskContext,
): void => {
  requireTaskScope(task.kind === 'action' && task.action);
  const scoped = selectTaskContext(task, context);
  if (verb === 'sync') return assertTaskSync(task.action, operation, payload, scoped);
  if (verb === 'prepare') return assertTaskPrepare(task.action, operation, payload, scoped);
  denyTaskScope();
};
