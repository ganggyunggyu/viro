import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { loginAccount, getPageForAccount, isAccountLoggedIn } from '../src/shared/lib/multi-session';
import { GoogleGenAI } from '@google/genai';
import type { Page } from 'playwright';

const ACCOUNT_ID = 'ahffkdlek12';
const CAFE_NAME = '육아 돌봄수첩';
const CAFE_SLUG = 'babycare702';
const CAFE_CATEGORY_MAJOR = '가족/육아';
const CAFE_CATEGORY_MINOR = '가족/육아일반';
const CAFE_DESCRIPTION = '아이 키우며 알아두면 편한 정보와 소소한 육아 일상을 나누는 공간입니다.';
const CAFE_KEYWORDS = ['육아', '육아정보', '돌봄', '아기용품', '초보맘'];
const SHOULD_SUBMIT = process.argv.includes('--submit');

const SHOT_DIR = '/private/tmp/claude-501/-Users-ganggyunggyu-Programing-cafe-bot/5fc81fea-7f63-45f9-adfc-41a37b1b4af3/scratchpad/cafe-create';

const CAPTCHA_MODEL = process.env.GEMINI_CAPTCHA_MODEL || 'gemini-3.5-flash';
let genAI: GoogleGenAI | null = null;
const getGenAI = (): GoogleGenAI => {
  if (genAI) return genAI;
  const apiKey =
    process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY 없음');
  genAI = new GoogleGenAI({ apiKey });
  return genAI;
};

const solveCreateCafeCaptcha = async (
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

    const ai = getGenAI();
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
    console.log(`[CAPTCHA] 시도 ${attempt}: "${answer || '(empty)'}"`);

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

const main = async () => {
  await connectDB();
  const account = await Account.findOne({ accountId: ACCOUNT_ID }).lean();
  if (!account) throw new Error('계정을 찾을 수 없음: ' + ACCOUNT_ID);

  const loggedIn = await isAccountLoggedIn(ACCOUNT_ID);
  if (!loggedIn) {
    const loginResult = await loginAccount(ACCOUNT_ID, account.password);
    console.log('[LOGIN]', loginResult);
    if (!loginResult.success) throw new Error('로그인 실패: ' + loginResult.error);
  } else {
    console.log('[LOGIN] 이미 로그인 상태');
  }

  const page = await getPageForAccount(ACCOUNT_ID);
  await page.goto('https://section.cafe.naver.com/ca-fe/home/create', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(2000);
  console.log('[NAV] 폼 URL:', page.url());

  // 카페이름
  await page.locator('input[placeholder="카페 이름을 입력해주세요"]').fill(CAFE_NAME);

  // 카페주소
  await page.locator('input[placeholder="카페 주소를 입력해주세요"]').fill(CAFE_SLUG);
  await page.waitForTimeout(500);

  const nameValue = await page.locator('input[placeholder="카페 이름을 입력해주세요"]').inputValue();
  const slugValue = await page.locator('input[placeholder="카페 주소를 입력해주세요"]').inputValue();
  console.log('[확인] 카페이름:', nameValue, '| 카페주소:', slugValue);
  await page.screenshot({ path: `${SHOT_DIR}/09-name-slug-filled.png` });

  // 공개 설정: 공개(바로 가입)
  await page.locator('#publicCafe').check({ force: true }).catch(() => {});

  // 이름 사용 여부: 별명 사용 (유일한 옵션)
  await page.locator('#useNick').check({ force: true }).catch(() => {});

  // 주제 대분류
  await page.locator('button:has-text("대분류 선택")').first().click();
  await page.waitForTimeout(500);
  await page.locator(`.option:has-text("${CAFE_CATEGORY_MAJOR}")`).first().click();
  await page.waitForTimeout(800);

  // 주제 소분류 - 열려있는(보이는) 옵션만 대상으로 선택
  await page.locator('button:has-text("소분류 선택")').first().click();
  await page.waitForTimeout(500);
  const allSubOptions = page.locator('.option');
  const subCount = await allSubOptions.count();
  const visibleSubOptions: string[] = [];
  let pickedIndex = -1;
  for (let i = 0; i < subCount; i += 1) {
    const opt = allSubOptions.nth(i);
    if (!(await opt.isVisible().catch(() => false))) continue;
    const text = (await opt.textContent())?.trim() || '';
    visibleSubOptions.push(text);
    if (text.replace('선택됨', '') === CAFE_CATEGORY_MINOR) pickedIndex = i;
  }
  console.log('[소분류 옵션(visible)]', visibleSubOptions);
  if (pickedIndex >= 0) {
    await allSubOptions.nth(pickedIndex).click();
    console.log('[소분류 선택]', CAFE_CATEGORY_MINOR);
  } else {
    console.warn('[소분류] 원하는 옵션을 못 찾음:', CAFE_CATEGORY_MINOR);
  }
  await page.waitForTimeout(500);

  // 카페 설명
  await page.locator('textarea[placeholder="카페 설명을 입력해주세요."]').fill(CAFE_DESCRIPTION);

  // 카페 검색어
  const keywordInput = page.locator('input[placeholder="검색어를 입력해주세요"]');
  for (const kw of CAFE_KEYWORDS) {
    await keywordInput.fill(kw);
    await page.locator('button.btn_srch:has-text("등록")').first().click();
    await page.waitForTimeout(400);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOT_DIR}/10-filled-before-captcha.png` });

  // 보안 절차 (캡차)
  const captchaResult = await solveCreateCafeCaptcha(page);
  console.log('[CAPTCHA RESULT]', captchaResult);
  if (!captchaResult.solved) {
    await page.screenshot({ path: `${SHOT_DIR}/11-captcha-failed.png` });
    throw new Error('캡차 풀이 실패: ' + captchaResult.error);
  }

  // 정책 동의
  await page.locator('#chk_ok_privacy').check({ force: true }).catch(async () => {
    await page.locator('#chk_ok_privacy').click({ force: true }).catch(() => {});
  });

  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOT_DIR}/12-ready-to-submit.png` });

  if (!SHOULD_SUBMIT) {
    console.log('[DRY RUN] --submit 플래그 없이 실행됨. 실제 제출은 하지 않음.');
    process.exit(0);
  }

  const submitCandidates = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a'))
      .filter((el) => el.textContent?.trim() === '만들기')
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          className: (el as HTMLElement).className,
          disabled: (el as HTMLButtonElement).disabled,
          visible: rect.width > 0 && rect.height > 0,
          rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        };
      });
  });
  console.log('[SUBMIT 후보]', JSON.stringify(submitCandidates, null, 2));

  await page.locator('a.BaseButton--green:has-text("만들기")').last().click();
  await page.waitForTimeout(4000);
  console.log('[SUBMIT] 결과 URL:', page.url());
  await page.screenshot({ path: `${SHOT_DIR}/13-after-submit.png` });

  const resultText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  console.log('[SUBMIT] 결과 텍스트 일부:', resultText.slice(0, 800));

  process.exit(0);
};

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
