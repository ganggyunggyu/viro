import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { getPageForAccount, isAccountLoggedIn } from '../src/shared/lib/multi-session';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const ACCOUNT_ID = 'angrykoala270';
const CREATE_CAFE_URL = 'https://section.cafe.naver.com/ca-fe/home/create';
const TARGET_MAJOR = process.argv[2] || '생활';

const main = async () => {
  await connectDB();
  const account = await Account.findOne({ accountId: ACCOUNT_ID }).lean();
  if (!account) throw new Error('no account');

  const loggedIn = await isAccountLoggedIn(ACCOUNT_ID);
  console.log('already logged in:', loggedIn);

  const page = await getPageForAccount(ACCOUNT_ID);
  await page.goto(CREATE_CAFE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.locator('button:has-text("대분류 선택")').first().click();
  await page.waitForTimeout(800);

  const majorOption = page.locator(`.option:has-text("${TARGET_MAJOR}")`).first();
  await majorOption.click();
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
  console.log(`=== MINOR CATEGORIES for "${TARGET_MAJOR}" ===`);
  console.log(JSON.stringify(minors, null, 2));

  process.exit(0);
};

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
}).finally(async () => {
  await closeAllContexts();
});
