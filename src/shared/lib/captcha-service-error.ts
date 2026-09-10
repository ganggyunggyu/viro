export const CAPTCHA_SERVICE_MESSAGES = {
  captcha_service_authentication_required: '캡차 풀이 서버 인증을 확인하지 못했습니다.',
  captcha_service_unavailable: '캡차 풀이 서버에 연결하지 못했습니다.',
  captcha_service_invalid_response: '캡차 풀이 서버 응답이 올바르지 않습니다.',
} as const;
export type CaptchaServiceErrorCode = keyof typeof CAPTCHA_SERVICE_MESSAGES;
export class CaptchaServiceError extends Error {
  constructor(public readonly code: CaptchaServiceErrorCode) {
    super(CAPTCHA_SERVICE_MESSAGES[code]);
    this.name = 'CaptchaServiceError';
  }
}
export const isCaptchaServiceError = (error: unknown): error is CaptchaServiceError => error instanceof CaptchaServiceError;

export const isCaptchaServiceErrorCode = (code: unknown): code is CaptchaServiceErrorCode =>
  typeof code === 'string' && Object.hasOwn(CAPTCHA_SERVICE_MESSAGES, code);
