import { taskError, type SchedulerTask } from '@/shared/lib/agent-scheduler/task-contract';
import { objectBody } from '@/shared/lib/agent-management/contract';
import { ACTION_TYPES } from '@/shared/lib/agent-management/action-contract';

export type CaptchaKind = 'login' | 'cafe-join' | 'cafe-create';
export interface TaskCaptchaPayload { image: string; question?: string; kind: CaptchaKind }
export interface TaskCaptchaAnswer { answer: string; kind: CaptchaKind }
export const MAX_CAPTCHA_IMAGE_BYTES = 1_048_576;
export const MAX_CAPTCHA_IMAGE_LENGTH = 1_398_104;
export const MAX_CAPTCHA_REQUEST_LENGTH = MAX_CAPTCHA_IMAGE_LENGTH + 16_384;
const invalid = (): never => taskError('invalid_captcha_payload', 400);
export const parseCaptchaKind = (raw: unknown): CaptchaKind => {
  if (raw !== 'login' && raw !== 'cafe-join' && raw !== 'cafe-create') return invalid();
  return raw;
};
export const parseTaskCaptchaPayload = (raw: unknown): TaskCaptchaPayload => {
  const body = objectBody(raw, ['image', 'question', 'kind']);
  const kind = parseCaptchaKind(body.kind);
  const { image, question } = body;
  if (typeof image !== 'string' || !image || image.length > MAX_CAPTCHA_IMAGE_LENGTH || image.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(image)) return invalid();
  const decoded = Buffer.from(image, 'base64');
  if (!decoded.length || decoded.length > MAX_CAPTCHA_IMAGE_BYTES || decoded.toString('base64') !== image) return invalid();
  if (question !== undefined && (typeof question !== 'string' || !question.trim() || question.length > 2000)) return invalid();
  if (kind === 'login' && typeof question !== 'string') return invalid();
  return { image, kind, ...(typeof question === 'string' ? { question: question.trim() } : {}) };
};
export const assertTaskCaptchaKind = (task: SchedulerTask, kind: CaptchaKind): void => {
  const validTask = task.kind === 'operation' ? task.operation?.type === 'write_comment' || task.operation?.type === 'join_cafe'
    : Boolean(task.action && ACTION_TYPES.includes(task.action.type));
  const join = task.kind === 'operation' ? task.operation?.type === 'join_cafe' : task.action?.type === 'cafe-join-all';
  const create = task.kind === 'action' && task.action?.type === 'cafe-create';
  if (!validTask || (kind !== 'login' && !(kind === 'cafe-join' && join) && !(kind === 'cafe-create' && create))) taskError('task_scope_denied', 403);
};
