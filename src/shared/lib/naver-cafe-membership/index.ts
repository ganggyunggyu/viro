import type { Page } from 'playwright';

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
      ? nickname
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
  await fillCafeJoinForm(page, nickname, answers);
  await page.waitForTimeout(800);

  const clickedSubmit = await clickFirstVisible(page, JOIN_SUBMIT_SELECTOR);
  if (!clickedSubmit) {
    return { status: 'failed', detail: '가입 제출 버튼 없음', beforeText };
  }

  await page.waitForTimeout(submitWaitMs);
  const afterSubmitText = await getPageText(page);

  if (/사용할 수 없는 별명|별명을 다시|이미 사용|중복/.test(afterSubmitText)) {
    return {
      status: 'failed',
      detail: `별명 충돌: ${afterSubmitText.slice(0, 120)}`,
      beforeText,
      afterSubmitText,
    };
  }

  if (/가입이 제한|가입할 수 없습니다|활동이 정지/.test(afterSubmitText)) {
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

    if (!verifyText.includes('카페 가입하기')) {
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
