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
const OUT_PATH = process.argv[2];

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
        reason: "screenshot_parrkk",
      });
      if (!r.success) throw new Error(`login failed: ${r.error}`);
    }

    const page = await getPageForAccount(CHECK_ACCOUNT_ID);
    await page.goto(`https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/${ARTICLE_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: OUT_PATH, fullPage: true });
    console.log("[SCREENSHOT SAVED]", OUT_PATH);

    const images = await page.$$eval("img", (els) =>
      els
        .filter((el) => (el as HTMLImageElement).naturalWidth > 100)
        .map((el) => ({ src: (el as HTMLImageElement).src, w: (el as HTMLImageElement).naturalWidth, h: (el as HTMLImageElement).naturalHeight })),
    );
    console.log("[실제 콘텐츠 이미지 개수]", images.length);
    images.forEach((img, i) => console.log(i, img.src.slice(0, 100), `(${img.w}x${img.h})`));
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
