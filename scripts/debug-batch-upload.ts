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
  const articleId = 2;
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
    body: JSON.stringify({ keyword: "천안웨딩홀", count: 3 }),
    signal: AbortSignal.timeout(150000),
  });
  const imgData = (await imgRes.json()) as { images?: Array<{ url: string }> };
  const images = (imgData.images || []).map((i) => i.url);
  console.log(`이미지 ${images.length}장 확보`);

  await acquireAccountLock(accountId);
  const tempFiles: string[] = [];
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
      console.log(`[DEBUG] 다이얼로그: ${dialog.message()}`);
      try { await dialog.accept(); } catch {}
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[BROWSER-ERR] ${msg.text()}`);
    });

    const modifyUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}/modify`;
    await page.goto(modifyUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("p.se-text-paragraph, .se-component-content", { timeout: 15000 });
    await page.waitForTimeout(2000);

    for (const img of images) {
      const idx = images.indexOf(img);
      const p = await downloadImageToTempFile(img, idx);
      if (p) tempFiles.push(p);
    }
    console.log(`임시파일 ${tempFiles.length}개:`, tempFiles);

    const imageButton = await page.$('button.se-image-toolbar-button, button[data-name="image"]');
    if (!imageButton) {
      console.log("이미지 버튼 못찾음");
      process.exit(1);
    }
    console.log("이미지 버튼 찾음, 클릭 시도");

    const [chooser] = await Promise.all([
      page.waitForEvent("filechooser", { timeout: 10000 }),
      imageButton.click(),
    ]);
    console.log("filechooser 이벤트 받음, multiple 지원 여부 확인 중...");
    const inputEl = chooser.element ? "있음" : "없음";
    console.log(`chooser.element: ${inputEl}`);

    // input의 multiple 속성 직접 확인
    const isMultiple = await chooser.element().evaluate((el: any) => el.multiple);
    console.log(`file input의 multiple 속성: ${isMultiple}`);

    await chooser.setFiles(tempFiles);
    console.log("setFiles 완료, 2초 대기 후 스크린샷");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCRATCH}/debug-batch-upload-immediately.png`, fullPage: true });

    for (let i = 0; i < 10; i++) {
      const count = await page.$$(".se-component.se-image").then((els) => els.length);
      console.log(`[POLL ${i}] .se-component.se-image count: ${count}`);
      if (count >= 3) break;
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: `${SCRATCH}/debug-batch-upload-after-poll.png`, fullPage: true });
    console.log("최종 스크린샷 저장 완료");
  } finally {
    cleanupTempFiles(tempFiles);
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
