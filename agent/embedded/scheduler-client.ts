import { CaptchaServiceError } from '../../src/shared/lib/captcha-service-error';
import type { SchedulerWorkerConfig } from './types';
import type { EmbeddedClient, ClaimedAction } from './client';
import type { ClaimedOperation } from '../lib/operation-client';
import { createSchedulerRequest } from './scheduler-request';
import { EmbeddedWorkerError } from './errors';

export const createSchedulerClient = (config: SchedulerWorkerConfig, fetcher: typeof fetch = fetch): EmbeddedClient => {
  const request = createSchedulerRequest(config, fetcher);
  let leaseId: string | undefined;
  const disabled = async (): Promise<never> => { throw new EmbeddedWorkerError('authentication_required'); };
  const bound = async (verb: string, body: Record<string, unknown> = {}) => {
    if (!leaseId) throw new EmbeddedWorkerError('execution_uncertain');
    return request(verb, { workerId: config.workerId, leaseId, ...body });
  };
  const handshake = async () => {
    const result = await request('authorize');
    if (result.authorized !== true || result.ownerScope !== config.ownerScope) throw new EmbeddedWorkerError('authentication_required');
  };
  const claim = async (kind: string, id: string) => {
    if (kind !== config.kind || id !== config.id || leaseId) throw new EmbeddedWorkerError('execution_uncertain');
    const { claimed } = await request('claim', { workerId: config.workerId });
    if (claimed === null) return null;
    if (!claimed || typeof claimed !== 'object' || !('leaseId' in claimed) || typeof claimed.leaseId !== 'string' || !claimed.leaseId || !('ownerScope' in claimed) || claimed.ownerScope !== config.ownerScope) throw new EmbeddedWorkerError('execution_uncertain');
    leaseId = claimed.leaseId;
    return claimed as Record<string, unknown>;
  };
  const heartbeat = async (id?: string) => {
    if (!id && !leaseId) return true;
    if (id && id !== config.id) throw new EmbeddedWorkerError('execution_uncertain');
    return (await bound('heartbeat')).ok === true;
  };
  return {
    handshake,
    operationHeartbeat: heartbeat,
    actionHeartbeat: heartbeat,
    claimOperation: async (id) => {
      const row = await claim('operation', id);
      return row === null ? null : { operation: row.operation, account: row.account, cafe: row.cafe } as ClaimedOperation;
    },
    claimAction: async (id) => (await claim('action', id))?.task as ClaimedAction | null ?? null,
    reportOperation: async (id, result) => {
      if (config.kind !== 'operation' || id !== config.id) throw new EmbeddedWorkerError('execution_uncertain');
      return (await bound('result', { result })).ok === true;
    },
    reportAction: async (id, result, uncertain) => {
      if (config.kind !== 'action' || id !== config.id) throw new EmbeddedWorkerError('execution_uncertain');
      return (await bound('result', { result, uncertain })).ok === true;
    },
    solveCaptcha: async (payload) => {
      const result = await bound('captcha', { payload });
      if (typeof result.answer !== 'string' || !result.answer.trim() || result.answer.length > 1000 || /[\u0000-\u001f\u007f]/.test(result.answer) || result.kind !== payload.kind) throw new CaptchaServiceError('captcha_service_invalid_response');
      return result.answer.trim();
    },
    broker: {
      claim: disabled, heartbeat: disabled, report: disabled, accounts: disabled, pool: disabled, plan: disabled,
      context: async () => {
        const result = await bound('context');
        if (!Array.isArray(result.accounts) || !Array.isArray(result.cafes)) throw new EmbeddedWorkerError('broker_unavailable');
        return { accounts: result.accounts, cafes: result.cafes };
      },
      sync: async (operation, payload) => bound('sync', { operation, payload }),
      prepare: async (operation, payload) => bound('prepare', { operation, payload }),
    },
  };
};
