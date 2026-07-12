import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

const SCRATCH = "/private/tmp/claude-501/-Users-ganggyunggyu-Programing-cafe-bot/7fc48bb3-780d-4d48-bfbc-1be391ceec28/scratchpad";

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const {
    getPageForAccount,
    isAccountLoggedIn,
    loginAccount,
    acquireAccountLock,
    releaseAccountLock,
  } = await import("../src/shared/lib/multi-session");
  const { uploadImages } = await import("../src/shared/lib/naver-cafe-writing/image-uploader");

  const accountId = "ahffkdlek12";
  const cafeId = "31754837";
  const articleId = 23;
  const TEXT_GEN_HUB_URL = process.env.TEXT_GEN_HUB_URL || "http://localhost:8000";

  const acc = await Account.findOne({ accountId }).lean();
  if (!acc) {
    console.log("계정 없음");
    process.exit(1);
  }

  console.log("이미지 3장 확보 중...");
  const imgRes = await fetch(`${TEXT_GEN_HUB_URL}/generate/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword: "접이식카트 활용법", count: 3 }),
    signal: AbortSignal.timeout(150000),
  });
  const imgData = (await imgRes.json()) as { images?: Array<{ url: string }> };
  const images = (imgData.images || []).map((i) => i.url);
  console.log(`이미지 ${images.length}장 확보`);

  console.log("테테 생성 중...");
  const teteRes = await fetch(`${TEXT_GEN_HUB_URL}/generate/tete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service: "육아", keyword: "접이식카트 활용법", ref: "" }),
    signal: AbortSignal.timeout(120000),
  });
  const teteData = (await teteRes.json()) as { content?: string };
  const raw = teteData.content || "";
  const lines0 = raw.split(/\r?\n/);
  const firstNonEmpty = lines0.findIndex((l) => l.trim());
  const title = (lines0[firstNonEmpty] || "").trim();
  const body = lines0.slice(firstNonEmpty + 1).join("\n").trim();
  console.log(`제목: ${title}`);

  await acquireAccountLock(accountId);
  try {
    const loggedIn = await isAccountLoggedIn(accountId);
    if (!loggedIn) {
      const loginResult = await loginAccount(accountId, (acc as any).password);
      if (!loginResult.success) {
        console.log(`로그인 실패: ${loginResult.error}`);
        process.exit(1);
      }
    }

    const page = await getPageForAccount(accountId);
    page.on("dialog", async (dialog) => {
      try {
        await dialog.accept();
      } catch {}
    });

    const modifyUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}/modify`;
    console.log("[DEBUG] 수정 페이지 이동:", modifyUrl);
    await page.goto(modifyUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("p.se-text-paragraph, .se-component-content", { timeout: 15000 });
    await page.waitForTimeout(2000);

    let titleInput = await page.$(
      '.FlexableTextArea textarea.textarea_input, textarea.textarea_input, textarea[placeholder*="제목"], input[placeholder*="제목"]'
    );
    if (titleInput) {
      await titleInput.click({ clickCount: 3 });
      await page.waitForTimeout(200);
      await titleInput.fill(title);
      await page.waitForTimeout(500);
    }

    const contentArea = await page.$("p.se-text-paragraph");
    if (!contentArea) {
      console.log("본문 영역 없음");
      process.exit(1);
    }
    await contentArea.click();
    await page.waitForTimeout(300);
    await page.keyboard.press("Meta+A");
    await page.waitForTimeout(200);
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    let guard = 0;
    while (guard < 10) {
      const staleImage = await page.$(".se-component.se-image");
      if (!staleImage) break;
      await staleImage.click();
      await page.waitForTimeout(200);
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(200);
      guard++;
    }
    console.log(`[DEBUG] 기존 이미지 ${guard}개 정리`);

    let textGuard = 0;
    while (textGuard < 60) {
      const paragraphs = await page.$$("p.se-text-paragraph");
      const nonEmpty: typeof paragraphs = [];
      for (const p of paragraphs) {
        const text = await p.textContent();
        if (text && text.trim()) nonEmpty.push(p);
      }
      if (nonEmpty.length === 0) break;
      await nonEmpty[0].click({ clickCount: 3, force: true }).catch(() => {});
      await page.waitForTimeout(150);
      await page.keyboard.press("Meta+A");
      await page.waitForTimeout(100);
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(150);
      textGuard++;
    }
    console.log(`[DEBUG] 남은 텍스트 문단 ${textGuard}개 정리`);

    const dumpOrder = async (label: string) => {
      const order = await page.evaluate(() => {
        const main =
          document.querySelector(".se-main-container") ||
          document.querySelector(".se-component-content")?.closest("div[class*='container']") ||
          document.querySelector("#SEDITOR") ||
          document.body.querySelector(".se-component")?.parentElement;
        if (!main) return "NO container found";
        const children = Array.from(main.querySelectorAll(".se-component"));
        return children
          .map((el) => {
            if (el.classList.contains("se-image")) return "IMG";
            if (el.classList.contains("se-text")) {
              const text = el.textContent?.trim().slice(0, 15) || "";
              return `TXT(${text})`;
            }
            return `OTHER(${el.className})`;
          })
          .join(" -> ");
      });
      console.log(`[ORDER ${label}] ${order}`);
    };

    await dumpOrder("정리 직후 (텍스트+이미지 클리어 완료)");

    console.log(`[MODIFY] 이미지 ${images.length}장 상단에 먼저 삽입`);
    const uploadSuccess = await uploadImages(page, images);
    console.log(`[MODIFY] 이미지 업로드 ${uploadSuccess ? "성공" : "실패"}`);

    await dumpOrder("이미지 3장 업로드 완료 직후");

    await page.waitForTimeout(500);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    const paragraphsAfterImages = await page.$$("p.se-text-paragraph");
    const lastParagraphAfterImages = paragraphsAfterImages[paragraphsAfterImages.length - 1];
    if (lastParagraphAfterImages) {
      await lastParagraphAfterImages.click({ timeout: 5000, force: true }).catch((e) => console.log(`[DEBUG] 마지막 문단 클릭 실패: ${e.message}`));
      await page.keyboard.press("End");
    }
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    await dumpOrder("텍스트 삽입 지점 이동 후 (타이핑 시작 전)");

    const SUBTITLE_PATTERN = /^\d+\.\s*/;
    const plainContent = body
      .replace(/<\/p>\s*<p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .trim();
    const groupLinesIntoParagraphs = (rawLines: string[]): string[] => {
      const items = rawLines.map((l) => l.trim()).filter(Boolean);
      const grouped: string[] = [];
      let i = 0;
      while (i < items.length) {
        if (SUBTITLE_PATTERN.test(items[i])) {
          if (grouped.length > 0 && grouped[grouped.length - 1] !== "") grouped.push("");
          grouped.push(items[i]);
          grouped.push("");
          i++;
          continue;
        }
        const groupSize = 2 + Math.floor(Math.random() * 3);
        let taken = 0;
        while (taken < groupSize && i < items.length && !SUBTITLE_PATTERN.test(items[i])) {
          grouped.push(items[i]);
          i++;
          taken++;
        }
        if (i < items.length) grouped.push("");
      }
      return grouped;
    };
    const lines = groupLinesIntoParagraphs(plainContent.split("\n"));

    // 전체 본문을 다 타이핑해서 순서 확인 (실제 플로우와 동일)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim()) {
        await page.keyboard.type(lines[i], { delay: 30 });
      }
      if (i < lines.length - 1) {
        await page.keyboard.press("Enter");
      }
      if (i % 5 === 0) {
        await dumpOrder(`타이핑 중 (${i + 1}/${lines.length}줄)`);
      }
    }

    await dumpOrder(`텍스트 전체(${lines.length}줄) 타이핑 후 (제출 전, 이게 핵심)`);

    await page.screenshot({ path: `${SCRATCH}/debug-pre-submit.png`, fullPage: true });
    console.log("[DEBUG] 제출 전 스크린샷 저장 완료");

    const submitButton = await page.$("a.BaseButton--skinGreen, a.BaseButton");
    if (submitButton) {
      await submitButton.click();
      console.log("[DEBUG] 제출 버튼 클릭함");
      try {
        await page.waitForURL(/articles\/\d+/, { timeout: 10000 });
        console.log("[DEBUG] URL 변화 감지됨:", page.url());
      } catch {
        console.log("[DEBUG] URL 변화 없음, 추가 대기...");
        await page.waitForTimeout(3000);
      }
      await page.waitForTimeout(1500);

      const dumpReadOrder = async (label: string) => {
        const order = await page.evaluate(() => {
          const components = Array.from(document.querySelectorAll(".se-component"));
          return components
            .map((el) => {
              if (el.classList.contains("se-image")) return "IMG";
              if (el.classList.contains("se-text")) {
                const text = el.textContent?.trim().slice(0, 15) || "";
                return `TXT(${text})`;
              }
              return `OTHER(${el.className})`;
            })
            .join(" -> ");
        });
        console.log(`[ORDER ${label}] ${order}`);
      };
      await dumpReadOrder("제출 직후 (읽기 페이지, 리다이렉트 후)");

      await page.screenshot({ path: `${SCRATCH}/debug-post-submit.png`, fullPage: true });
      console.log("[DEBUG] 제출 후 스크린샷 저장 완료");
    } else {
      console.log("[DEBUG] 제출 버튼을 찾을 수 없음");
    }
  } finally {
    releaseAccountLock(accountId);
  }

  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error("ERROR:", e.message, e.stack);
    process.exit(1);
  });
