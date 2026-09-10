import type { ViroDesktopAction } from '../../src/shared/types/viro-desktop';
import { createBrokerPost, type BrokerClient } from './broker-client';
import type { AgentConfig } from './config';
import { processActionTask } from './action-runner';
import { executeDesktopAction } from '../desktop-actions';
import { parseRemoteAction } from '../../src/shared/lib/agent-management/action-contract';

export const createActionClient = (config: AgentConfig, broker: BrokerClient) => {
  const post = createBrokerPost(config);
  let activeId: string | undefined;
  const heartbeat = async () => {
    const response = await post('/api/agent/actions/heartbeat', { workerId: config.workerId, taskId: activeId });
    return response.ok === true;
  };
  const processNext = async () => {
    const response = await post('/api/agent/actions/claim', { workerId: config.workerId });
    const task = response.task as { id: string; action: ViroDesktopAction } | null;
    if (!task) return false;
    activeId = task.id;
    try {
      await processActionTask(parseRemoteAction(task.action), {
        heartbeat,
        execute: async (action) => executeDesktopAction(action, broker),
        report: async (result, uncertain) => {
          const reported = await post('/api/agent/actions/result', { workerId: config.workerId, taskId: task.id, result, uncertain });
          return reported.ok === true;
        },
      });
      return true;
    } finally { activeId = undefined; }
  };
  return { heartbeat, processNext };
};
