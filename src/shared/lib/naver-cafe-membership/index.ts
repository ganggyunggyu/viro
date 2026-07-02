import type { Page } from 'playwright';
import { GoogleGenAI } from '@google/genai';

export interface NaverCafeTarget {
  cafeId: string;
  cafeUrl?: string;
  name?: string;
}

export type CafeJoinStatus = 'joined' | 'alreadyMember' | 'failed';

export interface JoinCafeMembershipOptions {
  nickname: string;
  answers?: string[];
  homeWaitMs?: number;
  formWaitMs?: number;
  submitWaitMs?: number;
  verifyWaitMs?: number;
  verifyAttempts?: number;
  logPrefix?: string;
}

export interface JoinCafeMembershipResult {
  status: CafeJoinStatus;
  detail: string;
  beforeText?: string;
  afterSubmitText?: string;
  verifyText?: string;
}

export interface CafeMemberCountResult {
  cafeId: string;
  name?: string;
  cafeUrl?: string;
  memberCount: number | null;
  rawText?: string;
}

const DEFAULT_JOIN_ANSWERS = [
  '네 확인했습니다',
  '네 알겠습니다',
  '네 동의합니다',
  '네 숙지했습니다',
];

const JOIN_BUTTON_SELECTOR = [
  'button:has-text("카페 가입하기")',
  'a:has-text("카페 가입하기")',
  'button:has-text("가입하기")',
  'a:has-text("가입하기")',
].join(', ');

const JOIN_SUBMIT_SELECTOR = [
  'button:has-text("동의 후 가입하기")',
  'a:has-text("동의 후 가입하기")',
  'button:has-text("가입하기")',
  'a:has-text("가입하기")',
  'button:has-text("확인")',
  'a:has-text("확인")',
  'button[type="submit"]',
  'input[type="submit"]',
].join(', ');

const NICKNAME_COLLISION_PATTERN = /사용할 수 없는 별명|별명을 다시|이미 사용|중복/;
const JOIN_RESTRICTED_PATTERN = /가입이 제한|가입할 수 없습니다|활동이 정지/;
const JOIN_PENDING_PATTERN = /가입.{0,5}신청.{0,5}완료|승인.{0,5}대기/;
const CAFE_JOIN_CAPTCHA_IMAGE_SELECTOR = [
  '.CafeJoinCaptcha img[alt*="보안문자"]',
  'img[alt*="보안문자"]',
].join(', ');
const CAFE_JOIN_CAPTCHA_INPUT_SELECTOR = [
  'textarea#label_join_captcha',
  'textarea[placeholder*="보안문자"]',
  'input[placeholder*="보안문자"]',
].join(', ');
const CAFE_JOIN_CAPTCHA_REFRESH_SELECTOR = [
  '.CafeJoinCaptcha button:has-text("새로고침")',
  'button.chaptcha_btn',
  'button:has-text("새로고침")',
].join(', ');
const CAFE_JOIN_CAPTCHA_MODEL = process.env.GEMINI_CAPTCHA_MODEL || 'gemini-3.5-flash';

let cafeJoinCaptchaClient: GoogleGenAI | null = null;

const getCafeJoinCaptchaClient = (): GoogleGenAI => {
  if (cafeJoinCaptchaClient) return cafeJoinCaptchaClient;

  const apiKey =
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 없음');
  }

  cafeJoinCaptchaClient = new GoogleGenAI({ apiKey });
  return cafeJoinCaptchaClient;
};

export const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const toCafeSlug = (cafeUrl?: string): string | undefined => {
  const trimmed = cafeUrl?.trim();
  if (!trimmed) return undefined;

  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^\/+/, '') || undefined;
  }

  const parsed = new URL(trimmed);
  const [firstPathPart] = parsed.pathname.split('/').filter(Boolean);
  if (!firstPathPart || firstPathPart === 'ca-fe') return undefined;

  return firstPathPart;
};

export const toMobileCafeHomeUrl = (target: NaverCafeTarget): string => {
  const slug = toCafeSlug(target.cafeUrl);
  return slug
    ? `https://m.cafe.naver.com/${slug}`
    : `https://m.cafe.naver.com/ca-fe/web/cafes/${target.cafeId}`;
};

export const toPcCafeHomeUrl = (target: NaverCafeTarget): string => {
  const slug = toCafeSlug(target.cafeUrl);
  return slug
    ? `https://cafe.naver.com/${slug}`
    : `https://cafe.naver.com/ca-fe/cafes/${target.cafeId}`;
};

export const getPageText = async (
  page: Page,
  timeout = 8000,
): Promise<string> => {
  return page.locator('body').innerText({ timeout }).catch(() => '');
};

export const extractCafeMemberCount = (text: string): number | null => {
  const match =
    text.match(/카페멤버수\s*\n?\s*([0-9,]+)/) ||
    text.match(/멤버\s*([0-9,]+)\s*명?/) ||
    text.match(/멤버\s*\n?\s*([0-9,]+)/);

  if (!match?.[1]) return null;

  const parsed = Number.parseInt(match[1].replace(/,/g, ''), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const sanitizeCafeNickname = (
  nickname: string,
  fallback: string,
): string => {
  const cleaned = nickname.replace(/[^0-9A-Za-z가-힣]/g, '').slice(0, 20);
  if (cleaned) return cleaned;

  const fallbackCleaned = fallback.replace(/[^0-9A-Za-z가-힣]/g, '').slice(0, 20);
  return fallbackCleaned || '회원';
};

export const clickFirstVisible = async (
  page: Page,
  selector: string,
): Promise<boolean> => {
  const candidates = page.locator(selector);
  const count = await candidates.count().catch(() => 0);

  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click({ force: true });
      return true;
    }
  }

  return false;
};

export const hasVisibleSelector = async (
  page: Page,
  selector: string,
): Promise<boolean> => {
  const candidates = page.locator(selector);
  const count = await candidates.count().catch(() => 0);

  for (let index = 0; index < count; index += 1) {
    if (await candidates.nth(index).isVisible().catch(() => false)) {
      return true;
    }
  }

  return false;
};

export const solveCafeJoinCaptchaOnPage = async (
  page: Page,
  options: { attempts?: number; logPrefix?: string } = {},
): Promise<{ solved: boolean; attempts: number; error?: string }> => {
  const { attempts = 8, logPrefix = 'NAVER_CAFE_JOIN' } = options;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const captchaImage = page.locator(CAFE_JOIN_CAPTCHA_IMAGE_SELECTOR).first();
    const visible = await captchaImage.isVisible({ timeout: 1500 }).catch(() => false);
    if (!visible) {
      return { solved: true, attempts: attempt - 1 };
    }

    try {
      const image = await captchaImage.screenshot({ type: 'png' });
      const ai = getCafeJoinCaptchaClient();
      const response = await ai.models.generateContent({
        model: CAFE_JOIN_CAPTCHA_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: image.toString('base64'),
                },
              },
              {
                text: [
                  '이미지에 보이는 네이버 카페 가입 보안문자만 정확히 읽어라.',
                  '문자는 흰색 또는 밝은색으로 보이고, 배경 무늬는 무시한다.',
                  '정답은 영문 알파벳 A-Z와 숫자 0-9 조합이다.',
                  '왼쪽에서 오른쪽 순서대로 읽는다.',
                  'I와 1, O와 0, B와 8, S와 5, Z와 2를 특히 조심해서 구분한다.',
                  '출력은 한 줄로, 설명 없이 문자만 쓴다.',
                  '공백, 따옴표, 문장부호는 쓰지 않는다.',
                  '대소문자가 애매하면 이미지에 가까운 형태로 쓴다.',
                ].join('\n'),
              },
            ],
          },
        ],
      });
      const answer = (response.text || '').replace(/[^0-9A-Za-z]/g, '').trim();
      console.log(`[${logPrefix}] cafe join captcha answer attempt=${attempt}: ${answer || '(empty)'}`);

      if (!answer) {
        await clickFirstVisible(page, CAFE_JOIN_CAPTCHA_REFRESH_SELECTOR);
        await page.waitForTimeout(1500);
        continue;
      }

      const input = page.locator(CAFE_JOIN_CAPTCHA_INPUT_SELECTOR).first();
      await input.fill(answer).catch(async () => {
        await input.click({ force: true });
        await page.keyboard.press('Meta+A');
        await page.keyboard.type(answer, { delay: 30 });
      });
      await page.waitForTimeout(700);
      await clickFirstVisible(page, JOIN_SUBMIT_SELECTOR);
      await page.waitForTimeout(2500);

      const stillVisible = await page.locator(CAFE_JOIN_CAPTCHA_IMAGE_SELECTOR).first()
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      const text = await getPageText(page, 3000);
      if (!stillVisible || !/보안문자를 정확히|보안문자를 입력/.test(text)) {
        return { solved: true, attempts: attempt };
      }

      await clickFirstVisible(page, CAFE_JOIN_CAPTCHA_REFRESH_SELECTOR);
      await page.waitForTimeout(1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[${logPrefix}] cafe join captcha failed attempt=${attempt}: ${message}`);
      await clickFirstVisible(page, CAFE_JOIN_CAPTCHA_REFRESH_SELECTOR).catch(() => false);
      await page.waitForTimeout(1500);
    }
  }

  return { solved: false, attempts, error: '카페 가입 보안문자 풀이 실패' };
};

export const gotoWithRetry = async (
  page: Page,
  url: string,
  options: { attempts?: number; timeoutMs?: number; logPrefix?: string } = {},
): Promise<void> => {
  const { attempts = 3, timeoutMs = 45_000, logPrefix = 'NAVER_CAFE' } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      return;
    } catch (error) {
      lastError = error;
      console.log(`[${logPrefix}] goto retry ${attempt}/${attempts}: ${url}`);
      await page.waitForTimeout(2000).catch(() => {});
    }
  }

  throw lastError;
};

export const fillCafeJoinForm = async (
  page: Page,
  nickname: string,
  answers: string[] = DEFAULT_JOIN_ANSWERS,
): Promise<void> => {
  const textControls = page.locator(
    'textarea:visible, input[type="text"]:visible, input:not([type]):visible',
  );
  const count = await textControls.count().catch(() => 0);
  let answerIndex = 0;

  for (let index = 0; index < count; index += 1) {
    const control = textControls.nth(index);
    const meta = await control.evaluate((element) => {
      const input = element as HTMLInputElement | HTMLTextAreaElement;
      return {
        id: input.id || '',
        name: input.name || '',
        placeholder: input.placeholder || '',
        value: input.value || '',
        label: input.labels?.[0]?.textContent || '',
        maxLength: input.maxLength,
      };
    });
    const joinedMeta = `${meta.id} ${meta.name} ${meta.placeholder} ${meta.label}`;
    const isNicknameField = /nick|닉네임|별명/.test(joinedMeta);
    const rawValue = isNicknameField
      ? sanitizeCafeNickname(nickname, '회원')
      : answers[answerIndex] || answers.at(-1) || DEFAULT_JOIN_ANSWERS[0];
    const maxLength = meta.maxLength > 0 ? meta.maxLength : rawValue.length;
    const value = rawValue.slice(0, maxLength);

    if (isNicknameField || !meta.value.trim()) {
      await control.fill(value).catch(async () => {
        await control.click({ force: true });
        await page.keyboard.press('Meta+A');
        await page.keyboard.type(value, { delay: 20 });
      });
    }

    if (!isNicknameField) answerIndex += 1;
  }

  const checkboxes = page.locator('input[type="checkbox"]');
  const checkboxCount = await checkboxes.count().catch(() => 0);

  for (let index = 0; index < checkboxCount; index += 1) {
    const checkbox = checkboxes.nth(index);
    if (!(await checkbox.isChecked().catch(() => true))) {
      await checkbox.check({ force: true }).catch(async () => {
        await checkbox.click({ force: true }).catch(() => {});
      });
    }
  }
};

export const readCafeMemberCount = async (
  page: Page,
  target: NaverCafeTarget,
  options: { waitMs?: number; includeRawText?: boolean; logPrefix?: string } = {},
): Promise<CafeMemberCountResult> => {
  const { waitMs = 2500, includeRawText = false, logPrefix } = options;
  await gotoWithRetry(page, toPcCafeHomeUrl(target), { logPrefix });
  await page.waitForTimeout(waitMs);

  const rawText = await getPageText(page, 10_000);
  return {
    cafeId: target.cafeId,
    name: target.name,
    cafeUrl: target.cafeUrl,
    memberCount: extractCafeMemberCount(rawText),
    ...(includeRawText ? { rawText } : {}),
  };
};

export const joinCafeMembership = async (
  page: Page,
  target: NaverCafeTarget,
  options: JoinCafeMembershipOptions,
): Promise<JoinCafeMembershipResult> => {
  const {
    nickname,
    answers,
    homeWaitMs = 2500,
    formWaitMs = 2500,
    submitWaitMs = 4500,
    verifyWaitMs = 2500,
    verifyAttempts = 2,
    logPrefix,
  } = options;
  const cafeHome = toMobileCafeHomeUrl(target);
  const cafeNickname = sanitizeCafeNickname(nickname, '회원');

  await gotoWithRetry(page, cafeHome, { logPrefix });
  await page.waitForTimeout(homeWaitMs);

  const beforeText = await getPageText(page);
  const clickedJoin = await clickFirstVisible(page, JOIN_BUTTON_SELECTOR);

  if (!clickedJoin) {
    if (!beforeText.includes('카페 가입하기')) {
      return { status: 'alreadyMember', detail: '가입 버튼 없음', beforeText };
    }

    return {
      status: 'failed',
      detail: '가입 버튼 텍스트는 있으나 클릭 대상 없음',
      beforeText,
    };
  }

  await page.waitForTimeout(formWaitMs);
  await fillCafeJoinForm(page, cafeNickname, answers);
  await page.waitForTimeout(800);

  const clickedSubmit = await clickFirstVisible(page, JOIN_SUBMIT_SELECTOR);
  if (!clickedSubmit) {
    return { status: 'failed', detail: '가입 제출 버튼 없음', beforeText };
  }

  await page.waitForTimeout(1500);
  const captchaResult = await solveCafeJoinCaptchaOnPage(page, { logPrefix });
  if (!captchaResult.solved) {
    return {
      status: 'failed',
      detail: captchaResult.error || '카페 가입 보안문자 풀이 실패',
      beforeText,
      afterSubmitText: await getPageText(page),
    };
  }

  await page.waitForTimeout(submitWaitMs);
  const afterSubmitText = await getPageText(page);

  if (NICKNAME_COLLISION_PATTERN.test(afterSubmitText)) {
    return {
      status: 'failed',
      detail: `별명 충돌: ${afterSubmitText.slice(0, 120)}`,
      beforeText,
      afterSubmitText,
    };
  }

  if (JOIN_RESTRICTED_PATTERN.test(afterSubmitText)) {
    return {
      status: 'failed',
      detail: afterSubmitText.slice(0, 160),
      beforeText,
      afterSubmitText,
    };
  }

  let verifyText = '';
  for (let attempt = 1; attempt <= verifyAttempts; attempt += 1) {
    await gotoWithRetry(page, cafeHome, { logPrefix });
    await page.waitForTimeout(verifyWaitMs * attempt);
    verifyText = await getPageText(page);
    const joinButtonVisible = await hasVisibleSelector(page, JOIN_BUTTON_SELECTOR);

    if (NICKNAME_COLLISION_PATTERN.test(verifyText)) {
      return {
        status: 'failed',
        detail: `별명 충돌: ${verifyText.slice(0, 120)}`,
        beforeText,
        afterSubmitText,
        verifyText,
      };
    }

    if (JOIN_RESTRICTED_PATTERN.test(verifyText)) {
      return {
        status: 'failed',
        detail: verifyText.slice(0, 160),
        beforeText,
        afterSubmitText,
        verifyText,
      };
    }

    if (JOIN_PENDING_PATTERN.test(verifyText)) {
      return {
        status: 'failed',
        detail: '가입 승인 대기',
        beforeText,
        afterSubmitText,
        verifyText,
      };
    }

    if (!joinButtonVisible) {
      return {
        status: 'joined',
        detail: '가입 버튼 사라짐',
        beforeText,
        afterSubmitText,
        verifyText,
      };
    }
  }

  return {
    status: 'failed',
    detail: '가입 후에도 가입 버튼 보임',
    beforeText,
    afterSubmitText,
    verifyText,
  };
};
