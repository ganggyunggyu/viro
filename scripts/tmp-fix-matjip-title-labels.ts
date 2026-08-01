/**
 * 맛집2 원고 첫 실행분 중 제목에 "[제목] " 라벨이 그대로 붙어 발행된 4개 글의
 * 제목만 고친다. 본문/이미지는 건드리지 않는다 — modifyArticleWithAccount는
 * 본문을 통째로 지우고 다시 타이핑하는 무거운 함수라 제목만 고치는 데는
 * 과함(이미지까지 다시 넣어줘야 함) — 제목 입력창만 채우고 저장 버튼만 누른다.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/tmp-fix-matjip-title-labels.ts
 */
import mongoose from 'mongoose';
import { Account } from '../src/shared/models/account';
import {
  acquireAccountLock,
  releaseAccountLock,
  loginAccount,
  getPageForAccount,
  saveCookiesForAccount,
  closeAllContexts,
  isAccountLoggedIn,
} from '../src/shared/lib/multi-session';

const TITLE_INPUT_SELECTOR =
  '.FlexableTextArea textarea.textarea_input, textarea.textarea_input, textarea[placeholder*="제목"], input[placeholder*="제목"]';

const TARGETS = [
  {
    cafeId: '31766237',
    articleId: 3,
    accountId: 'geenl',
    newTitle: '대구맛집 미성당 납작 만두 본점, 가격표부터 살핀 한 끼',
  },
  {
    cafeId: '31766238',
    articleId: 4,
    accountId: 'cothdals1001',
    newTitle: '명동 이테르, 빛과 파스타가 어울린 데이트맛집',
  },
];

const fixOneTitle = async (target: (typeof TARGETS)[number]): Promise<void> => {
  const { cafeId, articleId, accountId, newTitle } = target;
  const accountDoc = await Account.findOne({ accountId }).lean();
  if (!accountDoc) {
    console.error(`[${accountId}] 계정 문서 없음`);
    return;
  }

  await acquireAccountLock(accountId);
  try {
    const loggedIn = await isAccountLoggedIn(accountId);
    if (!loggedIn) {
      const loginResult = await loginAccount(accountId, accountDoc.password, {
        reason: `fix_title:${articleId}`,
      });
      if (!loginResult.success) {
        console.error(`[${accountId}] 로그인 실패: ${loginResult.error}`);
        return;
      }
    }

    const page = await getPageForAccount(accountId);
    page.on('dialog', async (dialog) => {
      try {
        await dialog.accept();
      } catch {}
    });

    const modifyUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}/modify`;
    console.log(`[${accountId}] 수정 페이지 이동: ${modifyUrl}`);
    await page.goto(modifyUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // 같은 계정으로 연달아 수정 페이지를 열면 직전 페이지의 SmartEditor 상태가 남아
    // 새 글의 폼이 완전히 채워지기 전에 입력해버려 저장이 씹히는 문제가 있었다
    // (실측: 두 번째 수정만 "완료" 로그는 찍혔는데 실제 반영이 안 됨) — 새로고침으로
    // 완전히 새 상태에서 시작하고, 제목 입력창에 실제 값이 들어올 때까지 기다린다.
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });

    let titleInput = await page.waitForSelector(TITLE_INPUT_SELECTOR, { timeout: 20000 });
    let beforeTitle = '';
    for (let i = 0; i < 15; i += 1) {
      beforeTitle = await titleInput.inputValue().catch(() => '');
      if (beforeTitle.trim().length > 0) break;
      await page.waitForTimeout(1000);
      titleInput = await page.waitForSelector(TITLE_INPUT_SELECTOR, { timeout: 20000 });
    }
    console.log(`[${accountId}] 기존 제목: "${beforeTitle}"`);
    if (!beforeTitle.trim()) {
      console.error(`[${accountId}] 기존 제목을 못 읽음 — 폼이 안 채워진 상태로 판단, 중단`);
      return;
    }

    await titleInput.click({ clickCount: 3 });
    await page.waitForTimeout(200);
    await titleInput.fill(newTitle);
    await page.waitForTimeout(500);

    const submitButton =
      (await page.$('a.BaseButton--skinGreen')) ?? (await page.$('a.BaseButton'));
    if (!submitButton) {
      console.error(`[${accountId}] 수정 완료 버튼을 찾을 수 없음`);
      return;
    }
    await submitButton.click();

    try {
      await page.waitForURL((url) => /\/articles\/\d+(?:$|[/?#])/.test(url.pathname) && !url.pathname.includes('/modify'), {
        timeout: 15000,
      });
    } catch {
      await page.waitForTimeout(4000);
    }
    await page.waitForTimeout(1000);

    console.log(`[${accountId}] 제목 수정 완료 → "${newTitle}" (${page.url()})`);
    await saveCookiesForAccount(accountId);
  } catch (error) {
    console.error(`[${accountId}] 실패:`, error instanceof Error ? error.message : error);
  } finally {
    releaseAccountLock(accountId);
  }
};

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  for (const target of TARGETS) {
    await fixOneTitle(target);
    await new Promise((r) => setTimeout(r, 5000));
  }
  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error('tmp-fix-matjip-title-labels failed:', e instanceof Error ? e.message : e);
    try {
      await closeAllContexts();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
