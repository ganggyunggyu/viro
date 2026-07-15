import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

// modifyArticleWithAccount는 본문 전체를 지웠다가 다시 쓰는 함수라 원본 이미지 URL을
// 재확보할 수 없는 이 케이스(제목만 너무 길게 뽑힌 기존 글)에는 쓰면 이미지가 통째로
// 날아간다. 그래서 여기서는 그 함수의 앞부분(수정 페이지 이동 → 제목 입력창 채우기)만
// 그대로 가져오고, 본문/이미지 정리 블록은 아예 건드리지 않은 채 바로 제출 버튼을 누른다.

// 이전 버전은 "^.*[.,!?~까지지요]"로 잘랐는데, 문자 클래스([...])는 "까지"/"지요"를
// 단어가 아니라 개별 글자(까/지/요)로만 매칭해서 의도한 동작이 아니었고, 40자 안에서
// 처음 나오는 쉼표에서 바로 끊겨버려(예: "마운자로 요요,") 제목이 과하게 짧아지는
// 문제가 있었다. 마지막 문장부호를 찾되 그 결과가 15자 미만이면(=너무 이른 지점에서
// 끊긴 것) 대신 40자 그대로 자른다.
const shortenTitle = (title: string): string => {
  if (title.length <= 40) return title;
  const window = title.slice(0, 40);
  const lastBreak = window.match(/^.*[.,!?~]/);
  if (lastBreak && lastBreak[0].trim().length >= 15) {
    return lastBreak[0].trim();
  }
  return window.trim();
};

interface TitleFixTarget {
  cafeId: string;
  articleId: number;
  ownerAccountId: string;
  forcedNewTitle?: string; // 라이브 제목 필드가 이미 짧게 덮어써져서 원본을 재구성해야 하는 경우
}

const TARGETS: TitleFixTarget[] = [
  {
    cafeId: "31755069",
    articleId: 28,
    ownerAccountId: "pixelninja3",
    // fix-article-title.log에 남은 1차 수정 전 원본 제목을 새 로직으로 다시 자른 결과
    forcedNewTitle: shortenTitle(
      "마운자로 요요, 용량 조절과 중단 후 체중 회복이 걱정된다면 이 글 하나로 해결한다. 마운자로의 작용 원리, 요요 발생 메커니즘, 예방 전략, 용량별 가격, 부작용 대처법, 장기 유지 팁까지 검색자가 궁금해하는 모든 정보를 수치와 근거로 정리했다."
    ),
  },
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
      const newTitle = target.forcedNewTitle ?? shortenTitle(currentTitle);
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
