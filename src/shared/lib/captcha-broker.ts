export type CaptchaKind = 'login' | 'cafe-join' | 'cafe-create';

type CaptchaEnvironment = Partial<Record<'BROKER_URL' | 'AGENT_TOKEN', string>>;

interface CaptchaBrokerInput {
  kind: CaptchaKind;
  image: string;
  question?: string;
}

interface CaptchaBrokerOptions {
  environment?: CaptchaEnvironment;
  fetcher?: typeof fetch;
}

export const hasCaptchaBrokerConfig = (
  environment: CaptchaEnvironment = process.env as CaptchaEnvironment,
): boolean => Boolean(environment.BROKER_URL?.trim() && environment.AGENT_TOKEN?.trim());

export const solveCaptchaViaBroker = async (
  input: CaptchaBrokerInput,
  options: CaptchaBrokerOptions = {},
): Promise<string> => {
  const {
    environment = process.env as CaptchaEnvironment,
    fetcher = fetch,
  } = options;
  const brokerUrl = environment.BROKER_URL?.replace(/\/+$/, '') || '';
  const token = environment.AGENT_TOKEN?.trim() || '';

  if (!brokerUrl || !token) {
    throw new Error('캡차 해석 서버 연결 정보 없음');
  }

  const response = await fetcher(`${brokerUrl}/api/agent/captcha`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`캡차 해석 서버 오류 (${response.status})`);
  }

  const data = await response.json() as { answer?: unknown };
  const answer = typeof data.answer === 'string' ? data.answer.trim() : '';
  if (!answer) {
    throw new Error('캡차 해석 서버가 빈 답변을 반환했습니다');
  }

  return answer;
};
