import type { EmbeddedWorkerConfig } from './types';
import type { AgentOperationResult } from '../../src/shared/lib/agent-management/contract';
import type { ViroDesktopAction, ViroDesktopActionResponse } from '../../src/shared/types/viro-desktop';
import type { ClaimedOperation } from '../lib/operation-client';
import type { BrokerClient } from '../lib/broker-client';
import type { SolveCaptchaInput } from '../../src/shared/lib/captcha-client';
import { EmbeddedWorkerError } from './errors';

export interface ClaimedAction { id: string; status: string; action: ViroDesktopAction }

export const createEmbeddedClient = (config: EmbeddedWorkerConfig, fetcher: typeof fetch = fetch) => {
  const url = new URL(config.brokerUrl);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) || url.username || url.password || url.search || url.hash || url.pathname !== '/' || !config.token || !config.workerId) {
    throw new EmbeddedWorkerError('broker_unavailable');
  }
  const request = async (path: string, body?: Record<string, unknown>): Promise<Record<string, unknown>> => {
    let response: Response;
    try {
      response = await fetcher(`${url.origin}${path}`, {
        method: body === undefined ? 'GET' : 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
        headers: { 'content-type': 'application/json', authorization: `Bearer ${config.token}` },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch { throw new EmbeddedWorkerError('broker_unavailable'); }
    if ([401, 403].includes(response.status)) throw new EmbeddedWorkerError('authentication_required');
    if (response.status === 404 && path === '/api/agent/embedded') throw new EmbeddedWorkerError('server_update_required');
    if (!response.ok) throw new EmbeddedWorkerError('broker_unavailable');
    try {
      const result: unknown = await response.json();
      if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error();
      return result as Record<string, unknown>;
    } catch { throw new EmbeddedWorkerError('broker_unavailable'); }
  };
  const postWorker = (path: string, body: Record<string, unknown> = {}) => request(path, { workerId: config.workerId, ...body });
  const handshake = async () => {
    const result = await request('/api/agent/embedded');
    if (result.protocol !== 'viro-embedded-worker/1' || result.claimById !== true) throw new EmbeddedWorkerError('server_update_required');
  };
  const operationHeartbeat = async (operationId?: string) => (await postWorker('/api/agent/operations/heartbeat', { operationId })).ok === true;
  const actionHeartbeat = async (taskId?: string) => (await postWorker('/api/agent/actions/heartbeat', { taskId })).ok === true;
  const claimOperation = async (id: string) => {
    if (!/^[a-f0-9]{24}$/.test(id)) throw new EmbeddedWorkerError('execution_uncertain');
    return (await postWorker(`/api/agent/operations/${id}/claim`)).claimed as ClaimedOperation | null;
  };
  const claimAction = async (id: string) => {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new EmbeddedWorkerError('execution_uncertain');
    return (await postWorker(`/api/agent/actions/${id}/claim`)).task as ClaimedAction | null;
  };
  const reportOperation = async (operationId: string, result: AgentOperationResult) =>
    (await postWorker('/api/agent/operations/result', { operationId, result })).ok === true;
  const reportAction = async (taskId: string, result: ViroDesktopActionResponse, uncertain: boolean) =>
    (await postWorker('/api/agent/actions/result', { taskId, result, uncertain })).ok === true;
  const solveCaptcha = async (input: SolveCaptchaInput): Promise<string> => {
    const result = await request('/api/agent/captcha', { ...input });
    if (typeof result.answer !== 'string' || !result.answer.trim()) throw new EmbeddedWorkerError('broker_unavailable');
    return result.answer.trim();
  };
  const disabled = async (): Promise<never> => { throw new EmbeddedWorkerError('execution_uncertain'); };
  const broker: BrokerClient = {
    claim: disabled, heartbeat: disabled, report: disabled, accounts: disabled, pool: disabled, plan: disabled,
    context: async () => {
      const result = await request('/api/agent/context', {});
      if (!Array.isArray(result.accounts) || !Array.isArray(result.cafes)) throw new EmbeddedWorkerError('broker_unavailable');
      return { accounts: result.accounts, cafes: result.cafes };
    },
    sync: async (operation, payload) => request('/api/agent/sync', { operation, payload }),
    prepare: async (operation, payload) => request('/api/agent/prepare', { operation, payload }),
  };
  return { handshake, operationHeartbeat, actionHeartbeat, claimOperation, claimAction, reportOperation, reportAction, solveCaptcha, broker };
};
export type EmbeddedClient = ReturnType<typeof createEmbeddedClient>;
