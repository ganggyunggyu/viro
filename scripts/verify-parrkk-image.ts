import mongoose from "mongoose";
import { User } from "../src/shared/models/user";
import { getAllAccounts } from "../src/shared/config/accounts";
import {
  acquireAccountLock,
  releaseAccountLock,
  loginAccount,
  isAccountLoggedIn,
  getPageForAccount,
  closeAllContexts,
} from "../src/shared/lib/multi-session";

const CAFE_ID = "31750246";
const ARTICLE_ID = 18;
const CHECK_ACCOUNT_ID = "dhtksk1p";

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const user = await User.findOne({ loginId: "21lab", isActive: true }).lean();
  const accounts = await getAllAccounts((user as any).userId);
  const account = accounts.find((x: any) => x.id === CHECK_ACCOUNT_ID);
  if (!account) throw new Error("account not found");

  await acquireAccountLock(CHECK_ACCOUNT_ID);
  try {
    const loggedIn = await isAccountLoggedIn(CHECK_ACCOUNT_ID);
    if (!loggedIn) {
      const r = await loginAccount(account.id, account.password, {
        waitForLoginMs: 60000,
        reason: "verify_parrkk_image",
      });
      if (!r.success) throw new Error(`login failed: ${r.error}`);
    }

    const page = await getPageForAccount(CHECK_ACCOUNT_ID);
    await page.goto(`https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/${ARTICLE_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(2500);
    console.log("[URL]", page.url());

    const frameEl = await page.$("iframe#cafe_main");
    const root = frameEl ? (await frameEl.contentFrame()) || page : page;

    const imgCount = await root.locator(".se-image-resource, .se-module-image img, .article_container img").count();
    console.log("[IMG COUNT]", imgCount);

    const bodyText = await root.locator("body").innerText({ timeout: 5000 }).catch(() => "");
    console.log("[HAS TITLE]", bodyText.includes("여름철 보양식 추천 리스트"));
    console.log("[SNIPPET]", bodyText.slice(0, 300));
  } finally {
    releaseAccountLock(CHECK_ACCOUNT_ID);
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
