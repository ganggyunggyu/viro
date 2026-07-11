import mongoose from "mongoose";
import { Account } from "../src/shared/models/account";
import {
  acquireAccountLock,
  releaseAccountLock,
  isAccountLoggedIn,
  loginAccount,
  getPageForAccount,
  saveCookiesForAccount,
  closeAllContexts,
} from "../src/shared/lib/multi-session";
import { uploadImages } from "../src/shared/lib/naver-cafe-writing/image-uploader";

const CAFE_ID = "31754837";
const OWNER_ACCOUNT_ID = "ahffkdlek12";
const IMAGE_GEN_URL = process.env.IMAGE_GEN_URL || "http://localhost:3939";

const TARGETS = [
  { articleId: 7, keyword: "신생아 수유 텀 잡는 법" },
  { articleId: 8, keyword: "이유식 시작 시기와 순서" },
  { articleId: 9, keyword: "아기 수면교육 방법" },
  { articleId: 10, keyword: "영유아 예방접종 일정 정리" },
];

const EDITOR_READY_SELECTOR =
  'p.se-text-paragraph, .FlexableTextArea textarea.textarea_input, .se-component-content';

const fetchImageAsBase64 = async (keyword: string): Promise<string | null> => {
  try {
    const searchRes = await fetch(
      `${IMAGE_GEN_URL}/api/image/search?q=${encodeURIComponent(keyword)}&n=5`,
    );
    if (!searchRes.ok) return null;
    const searchData = (await searchRes.json()) as {
      success: boolean;
      data?: { results: Array<{ imageUrl: string }> };
    };
    const results = searchData.data?.results || [];
    if (results.length === 0) return null;
    const picked = results[Math.floor(Math.random() * results.length)];
    const proxyRes = await fetch(`${IMAGE_GEN_URL}${picked.imageUrl}`);
    if (!proxyRes.ok) return null;
    const buf = Buffer.from(await proxyRes.arrayBuffer());
    return `data:image/webp;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
};

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const acc = await Account.findOne({ accountId: OWNER_ACCOUNT_ID }).lean();
  if (!acc) throw new Error("account not found");

  await acquireAccountLock(OWNER_ACCOUNT_ID);
  try {
    const loggedIn = await isAccountLoggedIn(OWNER_ACCOUNT_ID);
    if (!loggedIn) {
      const r = await loginAccount(OWNER_ACCOUNT_ID, (acc as any).password, {
        waitForLoginMs: 60000,
        reason: "backfill_images",
      });
      if (!r.success) throw new Error(`login failed: ${r.error}`);
    }

    const page = await getPageForAccount(OWNER_ACCOUNT_ID);
    page.on("dialog", async (d: any) => {
      await d.accept().catch(() => {});
    });

    for (const target of TARGETS) {
      console.log(`[articleId=${target.articleId}] 이미지 검색 중: ${target.keyword}`);
      const image = await fetchImageAsBase64(target.keyword);
      if (!image) {
        console.log(`[articleId=${target.articleId}] 이미지 못 찾음, 스킵`);
        continue;
      }

      const modifyUrl = `https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/${target.articleId}/modify`;
      await page.goto(modifyUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForSelector(EDITOR_READY_SELECTOR, { timeout: 15000 });
      await page.waitForTimeout(2000);

      const contentArea = await page.$("p.se-text-paragraph");
      if (!contentArea) {
        console.log(`[articleId=${target.articleId}] 본문 입력창 없음, 스킵`);
        continue;
      }
      await contentArea.click();
      await page.waitForTimeout(300);
      await page.keyboard.press("Meta+Home").catch(() => {});
      await page.keyboard.press("Control+Home").catch(() => {});
      await page.waitForTimeout(300);

      const uploaded = await uploadImages(page, [image]);
      console.log(`[articleId=${target.articleId}] 업로드 결과: ${uploaded}`);
      await page.waitForTimeout(1000);

      const submitButton = await page.$("a.BaseButton--skinGreen, a.BaseButton");
      if (!submitButton) {
        console.log(`[articleId=${target.articleId}] 완료 버튼 없음, 스킵`);
        continue;
      }
      await submitButton.click();
      try {
        await page.waitForURL((url: URL) => !url.toString().includes("/modify"), { timeout: 10000 });
      } catch {
        await page.waitForTimeout(3000);
      }
      console.log(`[articleId=${target.articleId}] 완료`);
    }

    await saveCookiesForAccount(OWNER_ACCOUNT_ID);
  } finally {
    releaseAccountLock(OWNER_ACCOUNT_ID);
  }

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error("ERROR:", e.message);
    try { await closeAllContexts(); } catch {}
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  });
