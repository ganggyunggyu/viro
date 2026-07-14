import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

const SCRATCH = "/private/tmp/claude-501/-Users-ganggyunggyu-Programing-cafe-bot/7fc48bb3-780d-4d48-bfbc-1be391ceec28/scratchpad";

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const { loginAccount, getPageForAccount, closeAllContexts, acquireAccountLock, releaseAccountLock } = await import(
    "../src/shared/lib/multi-session"
  );

  const accountId = "pixelninja3";
  const cafeId = "31755069";
  const articleId = 19;

  const acc = await Account.findOne({ accountId }).lean();
  if (!acc) {
    console.log("계정 없음");
    process.exit(1);
  }

  await acquireAccountLock(accountId);
  try {
    const loginResult = await loginAccount(accountId, (acc as any).password);
    if (!loginResult.success) {
      console.log(`로그인 실패: ${loginResult.error}`);
      process.exit(1);
    }
    const page = await getPageForAccount(accountId);
    await page.goto(`https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}?boardtype=L&menuid=1`, {
      waitUntil: "networkidle",
      timeout: 20000,
    });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: `${SCRATCH}/check-fresh-publish-19.png`,
      fullPage: true,
    });
    console.log("스크린샷 저장 완료");
  } finally {
    releaseAccountLock(accountId);
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
