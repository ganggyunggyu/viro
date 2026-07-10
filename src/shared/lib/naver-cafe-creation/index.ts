/**
 * 네이버 카페 "개설(생성)" 자동화.
 *
 * 카페 "가입"과는 완전히 다른 기능이다 — 기존 카페에 가입하는 로직은
 * `naver-cafe-membership/index.ts` 와 `features/auto-comment/batch/cafe-join.ts` 를 참고할 것.
 * 이 모듈은 계정으로 로그인한 뒤 https://section.cafe.naver.com/ca-fe/home/create 폼을 채워
 * 실제로 새 카페를 만드는 흐름만 담당한다.
 *
 * 카페 만들기 폼의 보안절차는 로그인 캡차(영수증형 텍스트질문, captcha-solver.ts)와는
 * 완전히 다른 그림문자형 캡차(`.SectionCreateCafeCaptcha`, nhncaptchav4.gif)라
 * 기존 캡차 solver를 재사용할 수 없어서 이 안에서 따로 푼다.
 *
 * 새 카페를 만들 때는 항상 이 모듈의 `createNaverCafe()` 를 통해서 만들 것 —
 * 폼 셀렉터를 다시 조사하거나 캡차 로직을 새로 짜지 말 것.
 */
import { GoogleGenAI } from '@google/genai';
import type { Page } from 'playwright';
import { getPageForAccount, isAccountLoggedIn, loginAccount } from '../multi-session';
import { Cafe } from '../../models/cafe';
import { Account } from '../../models/account';

export interface CreateCafeInput {
  name: string;
  /** cafe.naver.com/{slug} 의 slug 부분. 영문/숫자만 허용됨 */
  slug: string;
  /** 주제 대분류 (예: '가족/육아'). 폼에 실제로 존재하는 텍스트와 정확히 일치해야 함 */
  categoryMajor: string;
  /** 주제 소분류 (예: '가족/육아일반'). 대분류를 먼저 선택해야 목록에 나타남 */
  categoryMinor: string;
  /** 100자 이내 */
  description: string;
  /** 카페 검색어. 최대 10개, 개별 등록 시 공백은 자동으로 제거됨 */
  keywords?: string[];
}

export interface CreateCafeResult {
  success: boolean;
  /** true면 실제 제출 없이 폼만 채우고 검증한 상태 (submitCafeCreateForm 미실행) */
  dryRun: boolean;
  cafeUrl?: string;
  cafeId?: string;
  name?: string;
  error?: string;
}

const CREATE_CAFE_URL = 'https://section.cafe.naver.com/ca-fe/home/create';
const CAPTCHA_MODEL = process.env.GEMINI_CAPTCHA_MODEL || 'gemini-3.5-flash';

let cafeCreateCaptchaClient: GoogleGenAI | null = null;

const getCafeCreateCaptchaClient = (): GoogleGenAI => {
  if (cafeCreateCaptchaClient) return cafeCreateCaptchaClient;

  const apiKey =
    process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY 없음');

  cafeCreateCaptchaClient = new GoogleGenAI({ apiKey });
  return cafeCreateCaptchaClient;
};

/** 카페 만들기 폼 하단의 그림문자 보안절차를 Gemini 비전으로 풀어서 입력칸에 채운다 */
export const solveCafeCreateCaptcha = async (
  page: Page,
  attempts = 6,
): Promise<{ solved: boolean; error?: string }> => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const container = page.locator('.SectionCreateCafeCaptcha').first();
    const image = container.locator('img').first();
    const input = container.locator('input.input_txt').first();
    const refreshBtn = container.locator('.captcha_btn.btn_re').first();

    const visible = await image.isVisible({ timeout: 2000 }).catch(() => false);
    if (!visible) return { solved: true };

    const shot = await image.screenshot({ type: 'png' }).catch(() => null);
    if (!shot) return { solved: false, error: '캡차 이미지 스크린샷 실패' };

    const ai = getCafeCreateCaptchaClient();
    const response = await ai.models.generateContent({
      model: CAPTCHA_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/png', data: shot.toString('base64') } },
            {
              text: [
                '이미지에 보이는 네이버 카페 만들기 보안문자(그림문자)를 정확히 읽어라.',
                '문자는 배경 사진 위에 겹쳐진 왜곡된 영문/숫자다.',
                'I와 1, O와 0, B와 8, S와 5, Z와 2를 조심해서 구분한다.',
                '출력은 한 줄, 설명 없이 문자만.',
                '공백, 따옴표, 문장부호는 쓰지 않는다.',
              ].join('\n'),
            },
          ],
        },
      ],
    });
    const answer = (response.text || '').replace(/[^0-9A-Za-z]/g, '').trim();

    if (!answer) {
      await refreshBtn.click().catch(() => {});
      await page.waitForTimeout(1500);
      continue;
    }

    await input.fill(answer);
    return { solved: true };
  }

  return { solved: false, error: '캡차 풀이 시도 초과' };
};

/** 카페이름 + 카페주소(slug) 입력. 실제로 입력된 값을 읽어 리턴해서 자동생성/트림 등으로 값이 달라졌는지 확인할 수 있게 한다 */
export const fillCafeIdentity = async (
  page: Page,
  name: string,
  slug: string,
): Promise<{ name: string; slug: string }> => {
  await page.locator('input[placeholder="카페 이름을 입력해주세요"]').fill(name);
  await page.locator('input[placeholder="카페 주소를 입력해주세요"]').fill(slug);
  await page.waitForTimeout(500);

  const confirmedName = await page.locator('input[placeholder="카페 이름을 입력해주세요"]').inputValue();
  const confirmedSlug = await page.locator('input[placeholder="카페 주소를 입력해주세요"]').inputValue();
  return { name: confirmedName, slug: confirmedSlug };
};

/** 공개(바로 가입) + 별명 사용을 명시적으로 클릭. 둘 다 폼 기본값이지만 네이버가 기본값을 바꿀 수 있으니 방어적으로 클릭해둔다 */
export const setCafeVisibilityDefaults = async (page: Page): Promise<void> => {
  await page.locator('#publicCafe').check({ force: true }).catch(() => {});
  await page.locator('#useNick').check({ force: true }).catch(() => {});
};

/**
 * 주제 대분류/소분류 선택.
 *
 * 주의: 소분류 드롭다운을 열면 대분류 목록의 `.option` 엘리먼트가 DOM에서 사라지지 않고
 * display:none 상태로 남아있다. `.option` 전체를 텍스트로 찾으면 숨어있는 대분류 옵션이
 * 먼저 걸릴 수 있으므로 반드시 `isVisible()` 로 걸러낸 요소 중에서만 선택해야 한다.
 */
export const selectCafeTopic = async (
  page: Page,
  categoryMajor: string,
  categoryMinor: string,
): Promise<{ majorSelected: boolean; minorSelected: boolean }> => {
  await page.locator('button:has-text("대분류 선택")').first().click();
  await page.waitForTimeout(500);
  const majorOption = page.locator(`.option:has-text("${categoryMajor}")`).first();
  const majorSelected = await majorOption
    .click()
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(800);

  await page.locator('button:has-text("소분류 선택")').first().click();
  await page.waitForTimeout(500);

  const allOptions = page.locator('.option');
  const count = await allOptions.count();
  let minorSelected = false;
  for (let i = 0; i < count; i += 1) {
    const opt = allOptions.nth(i);
    if (!(await opt.isVisible().catch(() => false))) continue;
    const text = (await opt.textContent())?.trim() || '';
    if (text.replace('선택됨', '') === categoryMinor) {
      await opt.click();
      minorSelected = true;
      break;
    }
  }
  await page.waitForTimeout(500);

  return { majorSelected, minorSelected };
};

export const fillCafeDescription = async (page: Page, description: string): Promise<void> => {
  await page.locator('textarea[placeholder="카페 설명을 입력해주세요."]').fill(description.slice(0, 100));
};

/** 검색어를 하나씩 입력 + 등록 클릭. 최대 10개, 개별 등록 시 내부 공백은 네이버가 자동으로 붙여쓴다 */
export const addCafeSearchKeywords = async (page: Page, keywords: string[]): Promise<void> => {
  const input = page.locator('input[placeholder="검색어를 입력해주세요"]');
  for (const keyword of keywords.slice(0, 10)) {
    await input.fill(keyword);
    await page.locator('button.btn_srch:has-text("등록")').first().click();
    await page.waitForTimeout(400);
  }
};

export const agreeToCafePolicy = async (page: Page): Promise<void> => {
  await page
    .locator('#chk_ok_privacy')
    .check({ force: true })
    .catch(async () => {
      await page.locator('#chk_ok_privacy').click({ force: true }).catch(() => {});
    });
};

/**
 * 최종 제출.
 *
 * 주의: "만들기" 버튼은 `<button>` 이 아니라 `<a class="BaseButton--green">` 앵커다.
 * `button:has-text("만들기")` 로 찾으면 0건 매칭되어 30초 타임아웃으로 죽는다 — 실제로 겪은 버그.
 *
 * 주의 2: 클릭 후 리다이렉트가 항상 4초 안에 끝나는 게 아니다. 같은 계정/같은 폼으로 재현해보면
 * 성공 판정이 붙었다 안 붙었다 하는데, 클릭 직후 한 번만 읽으면 리다이렉트가 아직 안 끝난
 * `cafe.naver.com` 포털 홈 화면(카페홈/이웃/구독 등 GNB 텍스트만 있는 상태)을 잡아서 실패로
 * 오판하는 경우가 실제로 있었다 — 그 사이 카페는 이미 만들어져 있었음. 그래서 한 번에 판정하지 않고
 * 새 카페 URL(`cafe.naver.com/{slug}`)로 이동했는지 + 성공 문구가 뜨는지를 몇 번 폴링해서 확인한다.
 */
export const submitCafeCreateForm = async (
  page: Page,
  slug: string,
): Promise<{ success: boolean; resultText: string; cafeUrl?: string }> => {
  await page.locator('a.BaseButton--green:has-text("만들기")').last().click();

  const expectedUrl = `https://cafe.naver.com/${slug}`;
  let resultText = '';

  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.waitForTimeout(1500);
    resultText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');

    if (resultText.includes('카페가 개설되었어요')) {
      return { success: true, resultText, cafeUrl: page.url() };
    }

    // 리다이렉트가 성공 팝업보다 늦게 뜨는 경우 대비: URL이 이미 새 카페면 한 번 더 텍스트를 다시 읽어본다
    if (page.url().startsWith(expectedUrl)) {
      await page.waitForTimeout(1000);
      resultText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
      const looksLikeCafeHome = resultText.includes('카페정보') && resultText.includes('매니저');
      if (looksLikeCafeHome) {
        return { success: true, resultText, cafeUrl: page.url() };
      }
    }
  }

  return { success: false, resultText };
};

/**
 * 방금 만든 카페의 숫자 cafeId(=clubid)를 알아낸다.
 * 카페 홈은 내부적으로 iframe 으로 렌더링되고, 그 프레임 URL에 `clubid=` 쿼리가 붙어있다.
 */
export const extractCafeIdFromPage = async (page: Page): Promise<string | undefined> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    for (const frame of page.frames()) {
      const match = frame.url().match(/clubid=(\d+)/i);
      if (match?.[1]) return match[1];
    }
    await page.waitForTimeout(1000);
  }
  return undefined;
};

/**
 * 네이버 카페 개설 전체 흐름.
 *
 * `options.dryRun` 이 true 면 마지막 제출 버튼은 누르지 않고 폼 채우기 + 캡차 풀이까지만
 * 진행한다. 실제 카페 생성은 외부에 노출되는 되돌리기 어려운 동작이므로,
 * 처음 시도하는 계정/카테고리 조합이라면 dryRun 으로 먼저 값이 맞게 채워지는지 확인할 것.
 */
export const createNaverCafe = async (
  accountId: string,
  password: string,
  input: CreateCafeInput,
  options: { dryRun?: boolean } = {},
): Promise<CreateCafeResult> => {
  const dryRun = options.dryRun ?? false;

  try {
    const loggedIn = await isAccountLoggedIn(accountId);
    if (!loggedIn) {
      const loginResult = await loginAccount(accountId, password);
      if (!loginResult.success) {
        return { success: false, dryRun, error: '로그인 실패: ' + loginResult.error };
      }
    }

    const page = await getPageForAccount(accountId);
    await page.goto(CREATE_CAFE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    await fillCafeIdentity(page, input.name, input.slug);
    await setCafeVisibilityDefaults(page);
    await selectCafeTopic(page, input.categoryMajor, input.categoryMinor);
    await fillCafeDescription(page, input.description);
    if (input.keywords?.length) {
      await addCafeSearchKeywords(page, input.keywords);
    }

    const captchaResult = await solveCafeCreateCaptcha(page);
    if (!captchaResult.solved) {
      return { success: false, dryRun, error: captchaResult.error || '캡차 풀이 실패' };
    }

    await agreeToCafePolicy(page);

    if (dryRun) {
      return { success: true, dryRun, name: input.name };
    }

    const submitResult = await submitCafeCreateForm(page, input.slug);
    if (!submitResult.success) {
      return {
        success: false,
        dryRun,
        error: 'CAFE_CREATE_FAILED: ' + submitResult.resultText.slice(0, 200),
      };
    }

    const cafeId = await extractCafeIdFromPage(page);

    return {
      success: true,
      dryRun,
      cafeUrl: submitResult.cafeUrl,
      cafeId,
      name: input.name,
    };
  } catch (error) {
    return {
      success: false,
      dryRun,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
};

export interface RegisterCreatedCafeOptions {
  menuId?: string;
  categories?: string[];
  categoryMenuIds?: Record<string, string>;
  categoryAliases?: Record<string, string>;
  commentableMenuIds?: number[];
  /** 카페를 실제로 개설한 네이버 계정. getAvailableOwnerAccounts()가 "이미 카페 가진 계정"을 걸러내는 기준이 된다 */
  ownerAccountId?: string;
}

/**
 * createNaverCafe() 로 실제로 만든 카페를 플랫폼 CafeConfig(DB)에 등록해서
 * getAllCafes()/카페 가입 UI 등 나머지 기능에서 바로 잡히게 한다.
 * upsert 방식이라 같은 카페를 다시 등록해도 에러 없이 그대로 반영된다
 * (entities/cafe/api 의 addCafeAction 은 soft-delete 후 재등록이 막히는 버그가 있어 그 방식은 따르지 않았다).
 */
export const registerCreatedCafeInDb = async (
  userId: string,
  cafe: { cafeId: string; cafeUrl: string; name: string },
  options: RegisterCreatedCafeOptions = {},
): Promise<void> => {
  const menuId = options.menuId ?? '1';
  const categories = options.categories ?? ['자유게시판'];

  await Cafe.findOneAndUpdate(
    { userId, cafeId: cafe.cafeId },
    {
      $set: {
        cafeUrl: cafe.cafeUrl,
        name: cafe.name,
        menuId,
        categories,
        categoryMenuIds: options.categoryMenuIds ?? { [categories[0]]: menuId },
        categoryAliases: options.categoryAliases,
        commentableMenuIds: options.commentableMenuIds ?? [Number(menuId)],
        ownerAccountId: options.ownerAccountId,
        isActive: true,
      },
      $setOnInsert: { isDefault: false },
    },
    { upsert: true },
  );
};

/**
 * 아직 어떤 카페도 소유하지 않은 계정 목록. 새 카페 개설 UI의 "소유 계정 선택" 드롭다운에 씀.
 * Cafe.ownerAccountId 가 채워진 계정(=이미 카페 개설에 쓰인 계정)은 제외한다.
 * ownerAccountId 를 기록하기 전에 만들어진 구 카페들은 이 필터에 안 걸리니 완전하지 않을 수 있음 —
 * 필요하면 [[reference-cafe-operations-sheet]] 의 "카페계정정보" 탭 소유카페 칸과 교차 확인할 것.
 */
export const getAvailableOwnerAccounts = async (
  userId: string,
): Promise<Array<{ accountId: string; nickname: string; role?: string }>> => {
  const [accounts, ownedAccountIds] = await Promise.all([
    Account.find({ userId, isActive: true }).select('accountId nickname role').lean(),
    Cafe.find({ userId, isActive: true, ownerAccountId: { $ne: null } }).distinct('ownerAccountId'),
  ]);

  const owned = new Set(ownedAccountIds);
  return accounts
    .filter((a) => !owned.has(a.accountId))
    .map((a) => ({ accountId: a.accountId, nickname: a.nickname || a.accountId, role: a.role }));
};

// 프리셋은 순수 데이터라 별도 파일(presets.ts)에 있음 — client component에서 바로 import 해도
// Playwright 같은 Node 전용 코드가 딸려오지 않게 하기 위함. 여기서는 서버 쪽 편의를 위해 재수출만 한다.
export { CAFE_TOPIC_PRESETS, type CafeTopicPreset } from './presets';
