import { CaptchaServiceError, isCaptchaServiceError, isCaptchaServiceErrorCode } from '../../src/shared/lib/captcha-service-error';
import { createHmac } from 'node:crypto';
import type { SchedulerWorkerConfig } from './types';
import { EmbeddedWorkerError } from './errors';

export const createSchedulerRequest = (config: SchedulerWorkerConfig, fetcher: typeof fetch) => {
  const url = new URL(config.brokerUrl);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) || url.username || url.password || url.search || url.hash || url.pathname !== '/' || Buffer.byteLength(config.serviceSecret) < 32 || !config.workerId || !['operation', 'action'].includes(config.kind) || !new RegExp(`^[a-f0-9]{${config.kind === 'operation' ? 24 : 64}}$`).test(config.id) || !/^[a-f0-9]{64}$/.test(config.dispatchId) || !/^[a-f0-9]{64}$/.test(config.ownerScope)) throw new EmbeddedWorkerError('broker_unavailable');
  return async (verb: string, body: Record<string, unknown> = {}): Promise<Record<string, unknown>> => {
    const path = `/api/agent/scheduler/tasks/${config.kind}/${config.id}/${verb}`;
    const rawBody = JSON.stringify({ dispatchId: config.dispatchId, ...body });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', config.serviceSecret).update(`${timestamp}\nPOST\n${path}\n${rawBody}`).digest('hex');
    try {
      const response = await fetcher(`${url.origin}${path}`, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(verb === 'captcha' ? 90000 : 30000), headers: { 'content-type': 'application/json', 'x-viro-timestamp': timestamp, 'x-viro-signature': signature }, body: rawBody });
      if (verb === 'captcha' && !response.ok) {
        const data: unknown = await response.json().catch(() => null);
        const suppliedCode = data && typeof data === 'object' && 'code' in data ? data.code : undefined;
        if (isCaptchaServiceErrorCode(suppliedCode)) throw new CaptchaServiceError(suppliedCode);
        const code = [401, 403, 409].includes(response.status) ? 'captcha_service_authentication_required' : response.status === 502 ? 'captcha_service_invalid_response' : 'captcha_service_unavailable';
        throw new CaptchaServiceError(code);
      }
      if ([401, 403].includes(response.status)) throw new EmbeddedWorkerError('authentication_required');
      if (!response.ok) throw new EmbeddedWorkerError('broker_unavailable');
      const result: unknown = await response.json().catch(() => {
        if (verb === 'captcha') throw new CaptchaServiceError('captcha_service_invalid_response');
        throw new Error();
      });
      if (!result || typeof result !== 'object' || Array.isArray(result)) {
        if (verb === 'captcha') throw new CaptchaServiceError('captcha_service_invalid_response');
        throw new Error();
      }
      return result as Record<string, unknown>;
    } catch (error) {
      if (error instanceof EmbeddedWorkerError || isCaptchaServiceError(error)) throw error;
      if (verb === 'captcha') throw new CaptchaServiceError('captcha_service_unavailable');
      throw new EmbeddedWorkerError('broker_unavailable');
    }
  };
};
