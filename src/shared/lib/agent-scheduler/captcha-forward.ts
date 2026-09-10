import { AgentManagementError } from '@/shared/lib/agent-management/contract';
import type { TaskCaptchaPayload, CaptchaKind } from '@/shared/lib/agent-scheduler/captcha-contract';
import { hasSchedulerDispatchConfig } from '@/shared/lib/agent-scheduler/outbox';
import { signSchedulerRequest } from '@/shared/lib/agent-scheduler/service-auth';
import { ownerScope, type SchedulerTask } from '@/shared/lib/agent-scheduler/task-contract';

interface ForwardOptions {
  fetcher?: typeof fetch;
  environment?: { VIRO_SCHEDULER_URL?: string; VIRO_SCHEDULER_SERVICE_SECRET?: string };
}
type FailureKind = 'authentication_required' | 'unavailable' | 'invalid_response';
const messages: Record<FailureKind, string> = {
  authentication_required: '캡차 서비스 인증 설정을 확인하세요.',
  unavailable: '캡차 서비스에 연결할 수 없습니다.',
  invalid_response: '캡차 서비스가 올바른 응답을 보내지 않았습니다.',
};
const fail = (kind: FailureKind): never => {
  throw new AgentManagementError(messages[kind], 502, `captcha_service_${kind}`);
};
const readLimitedJson = async (response: Response): Promise<unknown> => {
  const reader = response.body?.getReader();
  if (!reader) throw new SyntaxError('empty_captcha_response');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 8192) {
        void reader.cancel().catch(() => undefined);
        throw new SyntaxError('captcha_response_too_large');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new SyntaxError('invalid_captcha_response_encoding'); }
  return JSON.parse(text);
};
const readFailure = async (response: Response): Promise<FailureKind | undefined> => {
  const data = await readLimitedJson(response).catch(() => undefined);
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const record = data as Record<string, unknown>;
  if (Object.hasOwn(record, 'error') && typeof record.error !== 'string') return undefined;
  if (Object.hasOwn(record, 'code') && typeof record.code !== 'string') return undefined;
  const code = Object.hasOwn(record, 'code') ? record.code : record.error;
  return (Object.keys(messages) as FailureKind[]).find((kind) => code === `captcha_service_${kind}`);
};
const hasControlCharacters = (answer: string): boolean => [...answer].some((character) => {
  const code = character.charCodeAt(0);
  return code < 32 || code === 127;
});
const readAnswer = async (response: Response, kind: CaptchaKind): Promise<{ answer: string; kind: CaptchaKind }> => {
  let data: unknown;
  try { data = await readLimitedJson(response); }
  catch (error) {
    if (error instanceof TypeError || (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name))) return fail('unavailable');
    return fail('invalid_response');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return fail('invalid_response');
  const record = data as Record<string, unknown>;
  if (Object.keys(record).length !== 2 || !Object.hasOwn(record, 'answer') || !Object.hasOwn(record, 'kind')) return fail('invalid_response');
  if (record.kind !== kind || typeof record.answer !== 'string' || record.answer.length > 1000 || hasControlCharacters(record.answer) || !record.answer.trim()) return fail('invalid_response');
  return { answer: record.answer.trim(), kind };
};

export const forwardTaskCaptcha = async (
  task: SchedulerTask, workerId: string, leaseId: string, captcha: TaskCaptchaPayload, options: ForwardOptions = {},
): Promise<{ answer: string; kind: CaptchaKind }> => {
  const { fetcher = globalThis.fetch, environment = process.env } = options;
  const { VIRO_SCHEDULER_URL: origin, VIRO_SCHEDULER_SERVICE_SECRET: secret } = environment;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) return fail('authentication_required');
  if (!hasSchedulerDispatchConfig(origin, secret)) return fail('unavailable');
  const url = new URL('/viro/captcha', origin);
  const { kind, id, dispatchId, userId } = task;
  const body = JSON.stringify({ task: { kind, id, dispatchId }, workerId, leaseId, ownerScope: ownerScope(userId), captcha });
  const headers = { 'content-type': 'application/json', ...signSchedulerRequest(secret, 'POST', url.pathname, body) };
  let response: Response;
  try { response = await fetcher(url, { method: 'POST', headers, body, redirect: 'error', signal: AbortSignal.timeout(75_000) }); }
  catch { return fail('unavailable'); }
  if (!response.ok) {
    const kind = await readFailure(response);
    return fail(kind ?? (response.status === 401 || response.status === 403 ? 'authentication_required' : 'unavailable'));
  }
  return readAnswer(response, captcha.kind);
};
