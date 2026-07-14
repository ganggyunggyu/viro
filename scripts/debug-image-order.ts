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
  const { downloadImageToTempFile, cleanupTempFiles } = await import(
    "../src/shared/lib/naver-cafe-writing/image-uploader"
  );

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

    await dumpOrder("정리 직후");

    const IMAGE_BUTTON_SELECTORS = ["button.se-image-toolbar-button"];
    const tempFiles: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const tempPath = await downloadImageToTempFile(images[i], i);
      if (tempPath) tempFiles.push(tempPath);
    }

    for (let i = 0; i < tempFiles.length; i++) {
      let imageButton = null;
      for (const sel of IMAGE_BUTTON_SELECTORS) {
        imageButton = await page.$(sel);
        if (imageButton) break;
      }
      if (!imageButton) {
        console.log(`[DEBUG] ${i + 1}번째 이미지 버튼 없음`);
        continue;
      }
      const [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser", { timeout: 10000 }),
        imageButton.click(),
      ]);
      await fileChooser.setFiles([tempFiles[i]]);
      await page.waitForTimeout(3000);
      for (let retry = 0; retry < 10; retry++) {
        const uploadProgress = await page.$(".se-upload-progress, .upload-progress, .se-loading");
        if (!uploadProgress) break;
        await page.waitForTimeout(1000);
      }
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);

      await dumpOrder(`이미지 ${i + 1} 업로드 직후 (커서 복구 전)`);

      if (i < tempFiles.length - 1) {
        const paragraphs = await page.$$("p.se-text-paragraph");
        console.log(`[DEBUG] 이미지 ${i + 1} 후 p.se-text-paragraph 개수: ${paragraphs.length}`);
        const lastParagraph = paragraphs[paragraphs.length - 1];
        if (lastParagraph) {
          await lastParagraph.click({ timeout: 5000, force: true }).catch((e) => console.log(`[DEBUG] 클릭 실패: ${e.message}`));
          await page.keyboard.press("End");
          await page.waitForTimeout(200);
        }
        await dumpOrder(`이미지 ${i + 1} 커서 복구 후`);
      }
    }

    cleanupTempFiles(tempFiles);

    await page.screenshot({ path: `${SCRATCH}/debug-editor-state.png`, fullPage: true });
    console.log("[DEBUG] 편집기 스크린샷 저장 완료 (제출 전)");
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
