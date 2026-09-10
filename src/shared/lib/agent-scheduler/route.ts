import { AgentManagementError, objectBody } from '@/shared/lib/agent-management/contract';
import { verifySchedulerRequest } from '@/shared/lib/agent-scheduler/service-auth';
import { MAX_CAPTCHA_REQUEST_LENGTH } from '@/shared/lib/agent-scheduler/captcha-contract';

export const schedulerJson = (value: unknown, status = 200): Response => Response.json(value, { status, headers: { 'cache-control': 'private, no-store' } });
export const withSchedulerAuth = <T>(handler: (body: Record<string, unknown>, context: T) => Promise<unknown>) =>
  async (request: Request, context: T): Promise<Response> => {
    try {
      const raw = await request.text();
      const captchaPath = /^\/api\/agent\/scheduler\/tasks\/(?:operation|action)\/[a-f0-9]+\/captcha$/.test(new URL(request.url).pathname);
      if (raw.length > (captchaPath ? MAX_CAPTCHA_REQUEST_LENGTH : 1_048_576)) return schedulerJson({ error: 'request_too_large', code: 'request_too_large' }, 413);
      if (!verifySchedulerRequest(process.env.VIRO_SCHEDULER_SERVICE_SECRET || '', request, raw)) return schedulerJson({ error: 'unauthorized', code: 'unauthorized' }, 401);
      let input: unknown;
      try { input = JSON.parse(raw); } catch { throw new AgentManagementError('invalid_request'); }
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AgentManagementError('invalid_request');
      return schedulerJson(await handler(objectBody(input, Object.keys(input)), context));
    } catch (error) {
      if (error instanceof AgentManagementError) return schedulerJson({ error: error.code, code: error.code }, error.status);
      return schedulerJson({ error: 'service_unavailable', code: 'service_unavailable' }, 503);
    }
  };
