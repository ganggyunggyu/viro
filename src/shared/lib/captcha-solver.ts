import { Page } from 'playwright';
import { GoogleGenAI } from '@google/genai';
import { createHash } from 'crypto';
import { captureFailureShot } from './debug-capture';
import {
  hasCaptchaBrokerConfig,
  solveCaptchaViaBroker,
} from '@/shared/lib/captcha-broker';
import {
  resolveGeminiApiKeyForAccount,
  resolveOpenaiApiKeyForAccount,
} from '@/shared/models/account';

const CAPTCHA_PROVIDER = process.env.CAPTCHA_PROVIDER || 'gemini';
const CAPTCHA_MODEL = process.env.GEMINI_CAPTCHA_MODEL || 'gemini-3.5-flash';
const OPENAI_CAPTCHA_MODEL = process.env.OPENAI_CAPTCHA_MODEL || 'gpt-5.6-luna';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_CAPTCHA_ATTEMPTS = 3;
const CAPTCHA_INPUT_DELAY_MS = 200;
const PW_INPUT_DELAY_MS = 150;
const LOGIN_CLICK_WAIT_MS = 3000;

const SELECTORS = {
  captchaType: '#captcha_type',
  captchaImg: '#captchaimg',
  captchaInfo: '#captcha_info',
  captchaInput: 'input#captcha',
  pwInput: 'input#pw',
  loginButton: 'button.btn_login, button#log\\.login',
} as const;

const resolveCaptchaApiKey = async (accountId: string): Promise<string | null> =>
  CAPTCHA_PROVIDER === 'openai'
    ? resolveOpenaiApiKeyForAccount(accountId)
    : resolveGeminiApiKeyForAccount(accountId);

// 전역 폴백 키는 없다 — 계정마다 자기 키가 등록돼있어야 캡차를 풀 수 있다.
export const canSolveCaptcha = async (accountId: string): Promise<boolean> =>
  Boolean(await resolveCaptchaApiKey(accountId)) || hasCaptchaBrokerConfig();

// 클라이언트를 캐싱하면 웹에서 키를 바꿔도 pm2 워커를 재시작하기 전까진 옛 키를
// 계속 쓰게 된다 — 캡차 시도마다 매번 그 계정의 최신 키로 새로 만든다(비용 거의 없음).
const getGeminiClient = async (accountId: string): Promise<GoogleGenAI> => {
  const apiKey = await resolveGeminiApiKeyForAccount(accountId);
  if (!apiKey) throw new Error(`${accountId} 계정에 등록된 Gemini 키 없음`);

  console.log(`[CAPTCHA] provider=${CAPTCHA_PROVIDER} model=${CAPTCHA_MODEL} account=${accountId}`);
  return new GoogleGenAI({ apiKey });
};

type CaptchaDetectResult = {
  detected: boolean;
  base64?: string;
  question?: string;
  captchaType?: string;
};

const safeEvaluate = async <T>(page: Page, fn: () => T, fallback: T): Promise<T> => {
  return page.evaluate(fn).catch(() => fallback);
};

export const detectCaptcha = async (page: Page): Promise<CaptchaDetectResult> => {
  const captchaType = await safeEvaluate(page, () => {
    const el = document.getElementById('captcha_type') as HTMLInputElement | null;
    return el?.value || '';
  }, '');

  if (!captchaType) return { detected: false };

  const base64 = await safeEvaluate(page, () => {
    const img = document.getElementById('captchaimg') as HTMLImageElement | null;
    if (!img?.src) return '';
    const match = img.src.match(/base64,(.+)/);
    return match?.[1] || '';
  }, '');

  if (!base64) return { detected: false };

  const question = await safeEvaluate(page, () => {
    const el = document.getElementById('captcha_info');
    return el?.textContent?.trim() || '';
  }, '');

  return { detected: true, base64, question, captchaType };
};

const buildCaptchaPrompt = (question: string): string =>
  `이 이미지는 네이버 로그인 캡차로 나오는 가상 영수증(receipt)이다.
영수증에는 상호명, 주소, 전화번호, 품목명, 단가, 수량, 합계 등이 표 형식으로 적혀있다.

단계:
1. 영수증의 모든 텍스트를 머릿속으로 정확히 OCR 한다.
2. 질문을 분해한다. (예: "전화번호의 뒤에서 2번째 숫자" → 전화번호 찾기 → 끝에서 2번째 자릿수 추출)
3. 정답을 결정한다.

질문: "${question}"

출력 규칙(절대 지킬 것):
- 답만 한 줄로 출력. 설명/사고과정/문장 금지.
- 숫자면 숫자만 (콤마, 원, 개 등 단위 제외).
- 도로명/품목명이면 그 단어만.
- 정확히 답을 모르면 가장 가능성 높은 추측 한 가지만.`;

const solveWithGemini = async (
  base64: string,
  question: string,
  accountId: string,
): Promise<string> => {
  const ai = await getGeminiClient(accountId);

  const response = await ai.models.generateContent({
    model: CAPTCHA_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64 } },
          { text: buildCaptchaPrompt(question) },
        ],
      },
    ],
  });

  return response.text?.trim() || '';
};

const solveWithOpenai = async (
  base64: string,
  question: string,
  accountId: string,
): Promise<string> => {
  const apiKey = await resolveOpenaiApiKeyForAccount(accountId);
  if (!apiKey) throw new Error(`${accountId} 계정에 등록된 OpenAI 키 없음`);

  console.log(`[CAPTCHA] provider=openai model=${OPENAI_CAPTCHA_MODEL} account=${accountId}`);

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_CAPTCHA_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'high' },
            },
            { type: 'text', text: buildCaptchaPrompt(question) },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OpenAI 캡차 API 오류 (${response.status}): ${JSON.stringify(data).slice(0, 200)}`);
  }

  const { prompt_tokens: promptTokens, completion_tokens: completionTokens } = data?.usage ?? {};
  console.log(`[CAPTCHA] ${accountId} 토큰 사용 — input=${promptTokens} output=${completionTokens}`);

  return data?.choices?.[0]?.message?.content?.trim() || '';
};

export const solveLoginCaptchaImage = async (
  base64: string,
  question: string,
  accountId: string
): Promise<{ answer: string; elapsed: number }> => {
  const startedAt = Date.now();
  const answer =
    CAPTCHA_PROVIDER === 'openai'
      ? await solveWithOpenai(base64, question, accountId)
      : await solveWithGemini(base64, question, accountId);

  return { answer, elapsed: Date.now() - startedAt };
};

const solveCaptchaImage = async (
  base64: string,
  question: string,
  accountId: string,
): Promise<{ answer: string; elapsed: number }> => {
  if (!hasCaptchaBrokerConfig()) {
    return solveLoginCaptchaImage(base64, question, accountId);
  }

  const startedAt = Date.now();
  const answer = await solveCaptchaViaBroker({
    kind: 'login',
    image: base64,
    question,
    accountId,
  });
  return { answer, elapsed: Date.now() - startedAt };
};

export const solveCaptchaOnPage = async (
  page: Page,
  accountId: string,
  password?: string
): Promise<{ solved: boolean; attempts: number; error?: string }> => {
  for (let attempt = 1; attempt <= MAX_CAPTCHA_ATTEMPTS; attempt++) {
    const captcha = await detectCaptcha(page);

    if (!captcha.detected) {
      return { solved: true, attempts: attempt - 1 };
    }

    // 클릭 후 고정 3초만 기다리므로, 네이버 응답이 느리면 아직 갱신되지 않은 이전 캡차를
    // 그대로 다시 읽을 수 있다. 그 경우 답이 맞아도 서버는 새 캡차의 답을 기대하므로 거절된다.
    // 회차 간 이미지 해시가 같으면 그 stale read가 실제로 일어나고 있다는 뜻이다.
    const imgHash = createHash('md5').update(captcha.base64 || '').digest('hex').slice(0, 8);
    console.log(
      `[CAPTCHA] ${accountId} 캡차 감지 (시도 ${attempt}/${MAX_CAPTCHA_ATTEMPTS}) — img=${imgHash}, 타입: ${captcha.captchaType}, 질문: ${captcha.question}`
    );

    try {
      const { answer, elapsed } = await solveCaptchaImage(captcha.base64!, captcha.question!, accountId);

      if (!answer) {
        console.warn(`[CAPTCHA] ${accountId} AI가 빈 답변 반환 — 재시도`);
        continue;
      }

      console.log(`[CAPTCHA] ${accountId} AI 답: "${answer}" (${elapsed}ms)`);

      await page.fill(SELECTORS.captchaInput, answer);
      await page.waitForTimeout(CAPTCHA_INPUT_DELAY_MS);

      const pwEmpty = await safeEvaluate(page, () =>
        (document.getElementById('pw') as HTMLInputElement)?.value === '', false);

      if (pwEmpty && password) {
        await page.fill(SELECTORS.pwInput, password);
        await page.waitForTimeout(PW_INPUT_DELAY_MS);
      }

      // 캡차 정답률이 질문 난이도와 무관하게 일정하다면 실패 원인은 답이 아니라 제출 폼 상태다.
      // 클릭 직전에 실제로 무엇이 들어있는지 남겨 둘 중 어느 쪽인지 가른다.
      const formState = await safeEvaluate(
        page,
        () => ({
          captcha: (document.getElementById('captcha') as HTMLInputElement)?.value ?? null,
          pwLength: (document.getElementById('pw') as HTMLInputElement)?.value?.length ?? null,
          id: (document.getElementById('id') as HTMLInputElement)?.value ?? null,
        }),
        null as { captcha: string | null; pwLength: number | null; id: string | null } | null,
      );
      console.log(
        `[CAPTCHA] ${accountId} 제출 직전 — captcha="${formState?.captcha}", pw길이=${formState?.pwLength}, id="${formState?.id}"`,
      );

      await page.click(SELECTORS.loginButton);
      await page.waitForTimeout(LOGIN_CLICK_WAIT_MS);

      if (!page.url().includes('nidlogin')) {
        console.log(`[CAPTCHA] ${accountId} 캡차 풀이 성공 (${attempt}회 시도)`);
        return { solved: true, attempts: attempt };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[CAPTCHA] ${accountId} 풀이 에러 (시도 ${attempt}): ${msg}`);
      await captureFailureShot(page, {
        tag: 'captcha-error',
        accountId,
        note: `시도 ${attempt}/${MAX_CAPTCHA_ATTEMPTS} 에러: ${msg} / 질문: ${captcha.question}`,
      });
      continue;
    }
  }

  console.log(`[CAPTCHA] ${accountId} ${MAX_CAPTCHA_ATTEMPTS}회 시도 실패`);
  await captureFailureShot(page, {
    tag: 'captcha-error',
    accountId,
    note: `${MAX_CAPTCHA_ATTEMPTS}회 시도 실패 (최종)`,
  });
  return { solved: false, attempts: MAX_CAPTCHA_ATTEMPTS, error: '캡차 풀이 최대 시도 초과' };
};
