/**
 * 캡차 풀이는 스케쥴러(21lab-scheduler)로 통일한다.
 *
 * 바이로가 Gemini/OpenAI 를 직접 부르던 코드는 지웠다. 같은 일을 두 저장소가
 * 각자 들고 있으면서 모델명과 환경변수가 갈라졌고, 한쪽 크레딧이 마르면
 * 다른 쪽만 살아 있는 상태가 반복됐다. 키도 스케쥴러 쪽 한 곳만 관리한다.
 */
import { createHmac } from 'node:crypto';

export type CaptchaKind = 'login' | 'cafe-join' | 'cafe-create';

export interface CaptchaEnvironment {
  CAPTCHA_API_URL?: string;
  CAPTCHA_API_TOKEN?: string;
  JWT_SECRET?: string;
  CAPTCHA_OWNER_ID?: string;
}

const DEFAULT_CAPTCHA_API_URL = 'https://21lab-scheduler.fly.dev';

/** 토큰이 로그에 남더라도 오래 살지 않도록 짧게 끊는다. */
const TOKEN_TTL_SECONDS = 5 * 60;

const base64Url = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const resolveCaptchaApiUrl = (env: CaptchaEnvironment): string =>
  (env.CAPTCHA_API_URL?.trim() || DEFAULT_CAPTCHA_API_URL).replace(/\/+$/, '');

/**
 * 스케쥴러는 다붓과 같은 JWT_SECRET 으로 토큰을 검증한다. 고정 토큰을 넣어두면
 * 만료돼 조용히 401 이 나므로, 비밀키가 있으면 부를 때마다 새로 서명한다.
 */
export const resolveCaptchaToken = (env: CaptchaEnvironment): string => {
  const fixed = env.CAPTCHA_API_TOKEN?.trim();
  if (fixed) return fixed;

  const secret = env.JWT_SECRET?.trim();
  const ownerId = env.CAPTCHA_OWNER_ID?.trim();
  if (!secret || !ownerId) return '';

  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({ sub: ownerId, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }),
  );
  const signature = base64Url(createHmac('sha256', secret).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${signature}`;
};

export const hasCaptchaApiConfig = (
  env: CaptchaEnvironment = process.env as CaptchaEnvironment,
): boolean => Boolean(resolveCaptchaToken(env));

export interface SolveCaptchaInput {
  image: string;
  kind: CaptchaKind;
  question?: string;
}

export const solveCaptchaViaScheduler = async (
  { image, kind, question }: SolveCaptchaInput,
  options: { environment?: CaptchaEnvironment; fetcher?: typeof fetch } = {},
): Promise<string> => {
  const { environment = process.env as CaptchaEnvironment, fetcher = fetch } = options;

  const token = resolveCaptchaToken(environment);
  if (!token) {
    throw new Error('캡차 서버 인증 정보 없음 (CAPTCHA_API_TOKEN 또는 JWT_SECRET+CAPTCHA_OWNER_ID)');
  }

  const response = await fetcher(`${resolveCaptchaApiUrl(environment)}/api/captcha/solve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ image, kind, question }),
  });

  if (!response.ok) {
    throw new Error(`캡차 서버 오류 (${response.status})`);
  }

  const data = (await response.json()) as { answer?: unknown };
  const answer = typeof data.answer === 'string' ? data.answer.trim() : '';
  if (!answer) {
    throw new Error('캡차 서버가 빈 답변을 반환했습니다');
  }
  return answer;
};
