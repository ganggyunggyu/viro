import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { getPageForAccount, loginAccount, isAccountLoggedIn } from '../src/shared/lib/multi-session';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const ACCOUNT_ID = 'angrykoala270';
const CREATE_CAFE_URL = 'https://section.cafe.naver.com/ca-fe/home/create';

const main = async () => {
  await connectDB();
  const account = await Account.findOne({ accountId: ACCOUNT_ID }).lean();
  if (!account) throw new Error('no account');

  const loggedIn = await isAccountLoggedIn(ACCOUNT_ID);
  if (!loggedIn) {
    const res = await loginAccount(ACCOUNT_ID, account.password);
    console.log('login:', res);
  }

  const page = await getPageForAccount(ACCOUNT_ID);
  await page.goto(CREATE_CAFE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.locator('button:has-text("대분류 선택")').first().click();
  await page.waitForTimeout(800);

  const majorOptions = page.locator('.option');
  const count = await majorOptions.count();
  const majors: string[] = [];
  for (let i = 0; i < count; i++) {
    const opt = majorOptions.nth(i);
    if (!(await opt.isVisible().catch(() => false))) continue;
    const text = (await opt.textContent())?.trim();
    if (text) majors.push(text);
  }
  console.log('=== MAJOR CATEGORIES ===');
  console.log(JSON.stringify(majors, null, 2));

  // Try clicking anything containing 맛집 or 지역 or 여행 or 생활
  const foodRelated = majors.filter((m) => /맛집|지역|여행|취미/.test(m));
  console.log('=== FOOD-RELATED CANDIDATES ===', foodRelated);

  for (const candidate of foodRelated) {
    try {
      const opt = page.locator(`.option:has-text("${candidate}")`).first();
      await opt.click();
      await page.waitForTimeout(800);

      const minorTrigger = page.locator('button:has-text("소분류 선택")').first();
      await minorTrigger.click();
      await page.waitForTimeout(800);

      const minorOptions = page.locator('.option');
      const mCount = await minorOptions.count();
      const minors: string[] = [];
      for (let i = 0; i < mCount; i++) {
        const opt2 = minorOptions.nth(i);
        if (!(await opt2.isVisible().catch(() => false))) continue;
        const text = (await opt2.textContent())?.trim();
        if (text) minors.push(text);
      }
      console.log(`=== MINOR CATEGORIES for "${candidate}" ===`);
      console.log(JSON.stringify(minors, null, 2));

      // reopen major dropdown for next candidate
      await minorTrigger.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
      await page.locator('button:has-text("대분류 선택")').first().click();
      await page.waitForTimeout(500);
    } catch (e) {
      console.log(`failed for ${candidate}:`, e);
    }
  }

  process.exit(0);
};

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
}).finally(async () => {
  await closeAllContexts();
});
