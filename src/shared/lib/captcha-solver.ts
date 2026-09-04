import { Page } from 'playwright';
import { createHash } from 'crypto';
import { captureFailureShot } from './debug-capture';
import { hasCaptchaApiConfig, solveCaptchaViaScheduler } from './captcha-client';

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

type CaptchaDetectResult = {
  detected: boolean;
  base64?: string;
  question?: string;
  captchaType?: string;
};

// 캡차 풀이는 스케쥴러가 한다. 계정별 AI 키는 더 이상 보지 않는다.
export const canSolveCaptcha = async (): Promise<boolean> => hasCaptchaApiConfig();

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

export const solveLoginCaptchaImage = async (
  base64: string,
  question: string,
): Promise<{ answer: string; elapsed: number }> => {
  const startedAt = Date.now();
  const answer = await solveCaptchaViaScheduler({ image: base64, question, kind: 'login' });
  return { answer, elapsed: Date.now() - startedAt };
};

const solveCaptchaImage = async (
  base64: string,
  question: string,
): Promise<{ answer: string; elapsed: number }> => solveLoginCaptchaImage(base64, question);

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
      const { answer, elapsed } = await solveCaptchaImage(captcha.base64!, captcha.question!);

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
