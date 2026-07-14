import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

// modifyArticleWithAccount는 본문 전체를 지웠다가 다시 쓰는 함수라 원본 이미지 URL을
// 재확보할 수 없는 이 케이스(제목만 너무 길게 뽑힌 기존 글)에는 쓰면 이미지가 통째로
// 날아간다. 그래서 여기서는 그 함수의 앞부분(수정 페이지 이동 → 제목 입력창 채우기)만
// 그대로 가져오고, 본문/이미지 정리 블록은 아예 건드리지 않은 채 바로 제출 버튼을 누른다.

const shortenTitle = (title: string): string => {
  if (title.length <= 40) return title;
  const cut = title.slice(0, 40).match(/^.*[.,!?~까지지요]/);
  return cut ? cut[0].trim() : title.slice(0, 40).trim();
};

interface TitleFixTarget {
  cafeId: string;
  articleId: number;
  ownerAccountId: string;
}

const TARGETS: TitleFixTarget[] = [
  { cafeId: "31755069", articleId: 30, ownerAccountId: "pixelninja3" },
  { cafeId: "31755069", articleId: 29, ownerAccountId: "pixelninja3" },
  { cafeId: "31755069", articleId: 28, ownerAccountId: "pixelninja3" },
  { cafeId: "31755069", articleId: 13, ownerAccountId: "pixelninja3" },
  { cafeId: "31755069", articleId: 9, ownerAccountId: "pixelninja3" },
  { cafeId: "31755069", articleId: 8, ownerAccountId: "pixelninja3" },
  { cafeId: "31755069", articleId: 2, ownerAccountId: "pixelninja3" },
];

const TITLE_INPUT_SELECTOR =
  '.FlexableTextArea textarea.textarea_input, textarea.textarea_input, textarea[placeholder*="제목"], input[placeholder*="제목"]';
const EDITOR_READY_SELECTOR =
  'p.se-text-paragraph, .FlexableTextArea textarea.textarea_input, .se-component-content';

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const {
    getPageForAccount,
    saveCookiesForAccount,
    isAccountLoggedIn,
    isLoginRedirect,
    loginAccount,
    acquireAccountLock,
    releaseAccountLock,
    closeAllContexts,
  } = await import("../src/shared/lib/multi-session");
  const { isModifyRedirectComplete } = await import("../src/shared/lib/naver-cafe-writing/article-modifier-utils");

  for (const target of TARGETS) {
    const { cafeId, articleId, ownerAccountId } = target;
    const acc = await Account.findOne({ accountId: ownerAccountId }).lean();
    if (!acc) {
      console.log(`[articleId=${articleId}] 계정 없음, 스킵`);
      continue;
    }

    await acquireAccountLock(ownerAccountId);
    try {
      const loggedIn = await isAccountLoggedIn(ownerAccountId);
      if (!loggedIn) {
        const loginResult = await loginAccount(ownerAccountId, (acc as any).password, { reason: `fix_title_${articleId}` });
        if (!loginResult.success) {
          console.log(`[articleId=${articleId}] 로그인 실패: ${loginResult.error}`);
          continue;
        }
      }

      const page = await getPageForAccount(ownerAccountId);
      page.on("dialog", async (dialog) => {
        try {
          await dialog.accept();
        } catch {}
      });

      await page.goto(`https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}/modify`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      if (isLoginRedirect(page.url())) {
        console.log(`[articleId=${articleId}] 로그인 리다이렉트, 스킵 (재시도 필요)`);
        continue;
      }

      await page.waitForSelector(EDITOR_READY_SELECTOR, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const titleInput = await page.$(TITLE_INPUT_SELECTOR);
      if (!titleInput) {
        console.log(`[articleId=${articleId}] 제목 입력창 없음, 스킵`);
        continue;
      }

      const currentTitle = await titleInput.inputValue().catch(() => "");
      const newTitle = shortenTitle(currentTitle);
      if (newTitle === currentTitle) {
        console.log(`[articleId=${articleId}] 이미 짧음, 스킵: "${currentTitle}"`);
        continue;
      }

      await titleInput.click({ clickCount: 3 });
      await page.waitForTimeout(200);
      await titleInput.fill(newTitle);
      await page.waitForTimeout(500);

      // 본문/이미지 영역은 절대 건드리지 않는다 — 바로 제출 버튼으로 이동
      const submitButton = await page.$("a.BaseButton--skinGreen, a.BaseButton");
      if (!submitButton) {
        console.log(`[articleId=${articleId}] 제출 버튼 없음, 스킵`);
        continue;
      }
      await submitButton.click();

      try {
        await page.waitForURL((url) => isModifyRedirectComplete(url.href), { timeout: 15000 });
      } catch {
        await page.waitForTimeout(5000);
      }
      await page.waitForTimeout(1500);
      await saveCookiesForAccount(ownerAccountId);

      console.log(`[OK][articleId=${articleId}] 제목 변경: "${currentTitle}" -> "${newTitle}"`);
    } catch (e: any) {
      console.log(`[ERROR][articleId=${articleId}] ${e.message}`);
    } finally {
      releaseAccountLock(ownerAccountId);
    }
  }

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERROR:", e);
    process.exit(1);
  });
