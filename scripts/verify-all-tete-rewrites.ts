import mongoose from "mongoose";

interface CafeInfo {
  cafeName: string;
  cafeId: string;
  ownerAccountId: string;
}

const CAFES: CafeInfo[] = [
  { cafeName: "육아 돌봄수첩", cafeId: "31754837", ownerAccountId: "ahffkdlek12" },
];

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const { browseCafePosts } = await import("../src/shared/lib/cafe-browser");
  const {
    loginAccount,
    getPageForAccount,
    closeAllContexts,
    acquireAccountLock,
    releaseAccountLock,
  } = await import("../src/shared/lib/multi-session");

  let totalOk3 = 0;
  let totalWrongCount = 0;
  let totalFailed = 0;
  const problems: string[] = [];

  for (const cafe of CAFES) {
    const acc = await Account.findOne({ accountId: cafe.ownerAccountId }).lean();
    if (!acc) continue;
    const password = (acc as any).password;

    const listResult = await browseCafePosts(
      { id: cafe.ownerAccountId, password },
      cafe.cafeId,
      undefined,
      { page: 1, perPage: 50 }
    );
    if (!listResult.success) {
      console.log(`[${cafe.cafeName}] 목록 조회 실패: ${listResult.error}`);
      continue;
    }

    const articleIds = (listResult.articles as any[])
      .map((a) => a.articleId)
      .filter((id) => id !== 1);

    console.log(`\n=== ${cafe.cafeName}: ${articleIds.length}개 검증 시작 ===`);

    await acquireAccountLock(cafe.ownerAccountId);
    try {
      const loginResult = await loginAccount(cafe.ownerAccountId, password);
      if (!loginResult.success) {
        console.log(`[${cafe.cafeName}] 로그인 실패: ${loginResult.error}`);
        continue;
      }
      const page = await getPageForAccount(cafe.ownerAccountId);

      for (const articleId of articleIds) {
        try {
          await page.goto(
            `https://cafe.naver.com/ca-fe/cafes/${cafe.cafeId}/articles/${articleId}?boardtype=L&menuid=1`,
            { waitUntil: "networkidle", timeout: 20000 }
          );
          await page.waitForTimeout(1000);

          const frame =
            page.frames().find((f) => f.url().includes("ArticleRead") || f.name() === "cafe_main") ||
            page.mainFrame();

          const imageCount = await frame
            .locator(".se-main-container img, .ArticleContentBox img")
            .evaluateAll((imgs) =>
              imgs.filter((img: any) => img.naturalWidth > 100 && img.naturalHeight > 100).length
            )
            .catch(() => -1);

          const subtitleCount = await frame
            .locator(".se-main-container")
            .first()
            .innerText({ timeout: 5000 })
            .then((text) => (text.match(/(?:^|\n)\s*\d+\.\s/g) || []).length)
            .catch(() => -1);

          if (imageCount === 3) {
            totalOk3++;
            console.log(`  [OK] articleId=${articleId} 이미지 3장, 소제목 ${subtitleCount}개`);
          } else {
            totalWrongCount++;
            const msg = `[${cafe.cafeName}] articleId=${articleId} 이미지 ${imageCount}장 (기대: 3장)`;
            problems.push(msg);
            console.log(`  [WARN] ${msg}`);
          }
        } catch (e: any) {
          totalFailed++;
          const msg = `[${cafe.cafeName}] articleId=${articleId} 검증 실패: ${e.message}`;
          problems.push(msg);
          console.log(`  [ERROR] ${msg}`);
        }
      }
    } finally {
      releaseAccountLock(cafe.ownerAccountId);
    }
  }

  console.log(`\n=== 최종 검증 요약 ===`);
  console.log(`이미지 3장 정상: ${totalOk3}개`);
  console.log(`이미지 개수 이상: ${totalWrongCount}개`);
  console.log(`검증 실패: ${totalFailed}개`);
  if (problems.length > 0) {
    console.log(`\n문제 목록:`);
    problems.forEach((p) => console.log(`  - ${p}`));
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
