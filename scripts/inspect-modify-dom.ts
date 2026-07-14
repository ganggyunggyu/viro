import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const { loginAccount, getPageForAccount, closeAllContexts, acquireAccountLock, releaseAccountLock } = await import(
    "../src/shared/lib/multi-session"
  );

  const accountId = "ahffkdlek12";
  const cafeId = "31754837";
  const articleId = 2;

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
    await page.goto(`https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}/modify`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForSelector("p.se-text-paragraph, .se-component-content", { timeout: 15000 });
    await page.waitForTimeout(2000);

    const info = await page.evaluate(() => {
      const paragraphs = Array.from(document.querySelectorAll("p.se-text-paragraph"));
      const imageButtons = Array.from(document.querySelectorAll("button.se-image-toolbar-button"));

      const describe = (el: Element) => {
        const rect = el.getBoundingClientRect();
        // 가장 가까운 의미있는 조상 컨테이너들을 몇 겹 추적
        const ancestors: string[] = [];
        let cur: Element | null = el.parentElement;
        let depth = 0;
        while (cur && depth < 8) {
          const id = cur.id ? `#${cur.id}` : "";
          const cls = cur.className && typeof cur.className === "string" ? `.${cur.className.split(" ").join(".")}` : "";
          ancestors.push(`${cur.tagName}${id}${cls}`.slice(0, 120));
          cur = cur.parentElement;
          depth++;
        }
        return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, ancestors };
      };

      return {
        paragraphCount: paragraphs.length,
        paragraphs: paragraphs.map((p, i) => ({ index: i, text: p.textContent?.slice(0, 20), ...describe(p) })),
        imageButtonCount: imageButtons.length,
        imageButtons: imageButtons.map((b, i) => ({ index: i, ...describe(b) })),
      };
    });

    console.log(JSON.stringify(info, null, 2));
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
