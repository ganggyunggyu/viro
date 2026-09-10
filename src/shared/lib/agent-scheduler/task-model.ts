import { AgentOperation, type IAgentOperation } from '@/shared/models/agent-operation';
import { AgentAction, type IAgentAction } from '@/shared/models/agent-action';
import type { SchedulerKind } from '@/shared/lib/agent-scheduler/task-contract';

export const readTaskDoc = (kind: SchedulerKind, filter: Record<string, unknown>) => kind === 'operation'
  ? AgentOperation.findOne(filter).lean<IAgentOperation | null>()
  : AgentAction.findOne(filter).lean<IAgentAction | null>();
export const updateTaskDoc = (kind: SchedulerKind, filter: Record<string, unknown>, update: Record<string, unknown>) => kind === 'operation'
  ? AgentOperation.updateOne(filter, update)
  : AgentAction.updateOne(filter, update);
export const claimTaskDoc = (kind: SchedulerKind, filter: Record<string, unknown>, update: Record<string, unknown>) => kind === 'operation'
  ? AgentOperation.findOneAndUpdate(filter, update, { new: true }).lean<IAgentOperation | null>()
  : AgentAction.findOneAndUpdate(filter, update, { new: true }).lean<IAgentAction | null>();
