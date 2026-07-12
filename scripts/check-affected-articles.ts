import mongoose from "mongoose";

const TARGETS = [
  { cafeId: "31755069", accountId: "pixelninja3", articleId: 18, name: "일상 소소담" },
  { cafeId: "31754869", accountId: "ahffkekd12", articleId: 20, name: "건강 체크노트" },
  { cafeId: "31754875", accountId: "ahsxkfldk12", articleId: 19, name: "건강 정보노트" },
  { cafeId: "31754837", accountId: "ahffkdlek12", articleId: 21, name: "육아 돌봄수첩" },
];

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const { loginAccount, getPageForAccount, closeAllContexts, acquireAccountLock, releaseAccountLock } = await import(
    "../src/shared/lib/multi-session"
  );

  for (const t of TARGETS) {
    const acc = await Account.findOne({ accountId: t.accountId }).lean();
    if (!acc) continue;

    await acquireAccountLock(t.accountId);
    try {
      const loginResult = await loginAccount(t.accountId, (acc as any).password);
      if (!loginResult.success) {
        console.log(`[${t.name}] 로그인 실패: ${loginResult.error}`);
        continue;
      }
      const page = await getPageForAccount(t.accountId);
      await page.goto(
        `https://cafe.naver.com/ca-fe/cafes/${t.cafeId}/articles/${t.articleId}?boardtype=L&menuid=1`,
        { waitUntil: "networkidle", timeout: 20000 }
      );
      await page.waitForTimeout(1500);
      const frame =
        page.frames().find((f) => f.url().includes("ArticleRead") || f.name() === "cafe_main") || page.mainFrame();
      const imageCount = await frame.locator(".se-image-resource").count();
      const bodyText = await frame
        .locator(".se-main-container")
        .first()
        .innerText({ timeout: 5000 })
        .catch(() => "(못찾음)");
      console.log(`[${t.name}] articleId=${t.articleId} 이미지 ${imageCount}장, 본문 ${bodyText.length}자`);
      console.log(`  본문 앞부분: ${bodyText.slice(0, 100).replace(/\n/g, " ")}`);
    } finally {
      releaseAccountLock(t.accountId);
    }
  }

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error("ERROR:", e.message);
    process.exit(1);
  });
