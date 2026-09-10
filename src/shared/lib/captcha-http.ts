import { CaptchaServiceError } from './captcha-service-error';
import type { SolveCaptchaInput } from './captcha-client';

export const requestCaptchaAnswer = async (url: string, token: string, input: SolveCaptchaInput, fetcher: typeof fetch): Promise<string> => {
  if (!token) throw new CaptchaServiceError('captcha_service_authentication_required');
  let response: Response;
  try {
    response = await fetcher(`${url}/api/captcha/solve`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45_000),
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(input),
    });
  } catch { throw new CaptchaServiceError('captcha_service_unavailable'); }
  if (!response.ok) throw new CaptchaServiceError([401, 403].includes(response.status) ? 'captcha_service_authentication_required' : 'captcha_service_unavailable');
  const data: unknown = await response.json().catch(() => { throw new CaptchaServiceError('captcha_service_invalid_response'); });
  const answer = data && typeof data === 'object' && 'answer' in data && typeof data.answer === 'string' ? data.answer.trim() : '';
  if (!answer || answer.length > 1000 || /[\u0000-\u001f\u007f]/.test(answer)) throw new CaptchaServiceError('captcha_service_invalid_response');
  return answer;
};
