import mongoose from "mongoose";
import { Account } from "../src/shared/models/account";
import {
  getPageForAccount,
  acquireAccountLock,
  releaseAccountLock,
  isAccountLoggedIn,
  loginAccount,
  saveCookiesForAccount,
  closeAllContexts,
} from "../src/shared/lib/multi-session";

const MONGODB_URI = process.env.MONGODB_URI!;

// argv: <accountId> <cafeId1>:<name1> <cafeId2>:<name2> ...
const [ACCOUNT_ID, ...cafeArgs] = process.argv.slice(2);
const CAFES = cafeArgs.map((arg) => {
  const [cafeId, ...nameParts] = arg.split(":");
  return { cafeId, name: nameParts.join(":") || cafeId };
});

const tryClickButton = async (page: any, texts: string[]): Promise<boolean> => {
  for (const text of texts) {
    const btn = page.locator(`button:has-text("${text}"), a:has-text("${text}")`).first();
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btn.click();
      return true;
    }
  }
  return false;
};

const tryFillNickname = async (page: any, nickname: string): Promise<void> => {
  const selectors = [
    'input[name="nickname"]',
    "input#nickname",
    'input[placeholder*="별명"]',
    'input[placeholder*="닉네임"]',
  ];
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
      await el.fill("");
      await el.fill(nickname);
      return;
    }
  }
};

const tryAgreeAll = async (page: any): Promise<void> => {
  const all = page.locator('input[type="checkbox"]');
  const cnt = await all.count();
  for (let i = 0; i < cnt; i++) {
    const cb = all.nth(i);
    if (!(await cb.isChecked().catch(() => true))) {
      await cb.check({ force: true }).catch(() => {});
    }
  }
};

const joinCafeAndVerify = async (
  page: any,
  cafe: { name: string; cafeId: string },
  nickname: string
): Promise<{ ok: boolean; reason: string }> => {
  const cafeUrl = `https://m.cafe.naver.com/ca-fe/web/cafes/${cafe.cafeId}`;
  await page.goto(cafeUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2500);

  const writeBtn = page.locator('a:has-text("글쓰기"), button:has-text("글쓰기"), a[href*="/articles/write"]').first();
  if (await writeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    return { ok: true, reason: "이미 가입됨 (글쓰기 보임)" };
  }

  const clickedJoin = await tryClickButton(page, ["카페 가입하기", "가입하기"]);
  if (!clickedJoin) {
    return { ok: false, reason: "가입 버튼 없음" };
  }
  await page.waitForTimeout(2500);

  await tryFillNickname(page, nickname);
  await page.waitForTimeout(500);

  await tryAgreeAll(page);
  await page.waitForTimeout(500);

  const submitClicked = await tryClickButton(page, ["동의 후 가입하기", "가입하기", "확인"]);
  if (!submitClicked) {
    return { ok: false, reason: "제출 버튼 없음" };
  }
  await page.waitForTimeout(4500);

  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000));

  if (/사용할 수 없는 별명|별명을 다시|중복|이미 사용/.test(bodyText)) {
    return { ok: false, reason: "별명 충돌" };
  }
  if (/가입이 제한|가입할 수 없습니다/.test(bodyText)) {
    return { ok: false, reason: "가입 제한" };
  }

  await page.goto(cafeUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2500);

  const writeAfter = page.locator('a:has-text("글쓰기"), button:has-text("글쓰기"), a[href*="/articles/write"]').first();
  if (await writeAfter.isVisible({ timeout: 1500 }).catch(() => false)) {
    return { ok: true, reason: "가입 후 글쓰기 버튼 확인" };
  }

  const stillJoinBtn = page.locator('button:has-text("가입하기"), a:has-text("가입하기")').first();
  if (await stillJoinBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    return { ok: false, reason: "가입 버튼 여전히 보임 (가입 미완료)" };
  }

  if (/가입.{0,3}신청.{0,3}완료|승인.{0,3}대기|승인.{0,3}후/.test(bodyText)) {
    return { ok: false, reason: "가입 신청 완료 (관리자 승인 대기)" };
  }

  return { ok: false, reason: "결과 불명 (글쓰기/가입버튼 둘 다 없음)" };
};

const main = async (): Promise<void> => {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const acc = await Account.findOne({ accountId: ACCOUNT_ID }).lean();
  if (!acc) {
    console.log(`[${ACCOUNT_ID}] 계정 없음`);
    await mongoose.disconnect();
    return;
  }

  await acquireAccountLock(ACCOUNT_ID);
  try {
    const loggedIn = await isAccountLoggedIn(ACCOUNT_ID);
    if (!loggedIn) {
      const r = await loginAccount(ACCOUNT_ID, acc.password, { waitForLoginMs: 60000, reason: "verify_join_multi" });
      if (!r.success) {
        console.log(`[${ACCOUNT_ID}] 로그인 실패: ${r.error}`);
        await mongoose.disconnect();
        return;
      }
    }
    console.log(`[${ACCOUNT_ID}] 로그인됨`);

    const page = await getPageForAccount(ACCOUNT_ID);
    page.on("dialog", async (d: any) => { try { await d.accept(); } catch {} });

    for (const cafe of CAFES) {
      const result = await joinCafeAndVerify(page, cafe, acc.nickname);
      console.log(`[${ACCOUNT_ID}] ${cafe.name}(${cafe.cafeId}) → ${result.ok ? "OK" : "FAIL"} ${result.reason}`);
    }

    await saveCookiesForAccount(ACCOUNT_ID);
  } finally {
    releaseAccountLock(ACCOUNT_ID);
  }

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error(e);
    try { await closeAllContexts(); } catch {}
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  });
