import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import {
  getPageForAccount,
  isAccountLoggedIn,
  loginAccount,
  closeAllContexts,
} from '../src/shared/lib/multi-session';
import {
  fillCafeIdentity,
  setCafeVisibilityDefaults,
  selectCafeTopic,
  fillCafeDescription,
  addCafeSearchKeywords,
  agreeToCafePolicy,
  solveCafeCreateCaptcha,
} from '../src/shared/lib/naver-cafe-creation';

const ACCOUNT_ID = 'angrykoala270';
const CREATE_CAFE_URL = 'https://section.cafe.naver.com/ca-fe/home/create';

const main = async () => {
  await connectDB();
  const account = await Account.findOne({ accountId: ACCOUNT_ID }).lean();
  if (!account) throw new Error('no account');

  if (!(await isAccountLoggedIn(ACCOUNT_ID))) {
    await loginAccount(ACCOUNT_ID, account.password);
  }

  const page = await getPageForAccount(ACCOUNT_ID);
  await page.goto(CREATE_CAFE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  await fillCafeIdentity(page, '맛집 미식노트', 'gourmetnote703');
  await setCafeVisibilityDefaults(page);
  await selectCafeTopic(page, '생활', '맛집');
  await fillCafeDescription(page, '여기저기 다녀본 맛집과 메뉴 후기를 편하게 기록하고 나누는 공간입니다.');
  await addCafeSearchKeywords(page, ['맛집', '맛집추천', '맛집후기', '맛집리스트', '맛집정보']);

  await agreeToCafePolicy(page);

  const captchaResult = await solveCafeCreateCaptcha(page);
  console.log('captcha result:', captchaResult);

  await page.screenshot({ path: '/tmp/cafe-create-before-submit.png', fullPage: true });

  await page.locator('a.BaseButton--green:has-text("만들기")').last().click();
  console.log('clicked 만들기, url now:', page.url());

  await page.waitForTimeout(3000);
  console.log('url after 3s:', page.url());
  await page.screenshot({ path: '/tmp/cafe-create-after-submit-1.png', fullPage: true });

  await page.waitForTimeout(3000);
  console.log('url after 6s:', page.url());
  await page.screenshot({ path: '/tmp/cafe-create-after-submit-2.png', fullPage: true });

  const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  console.log('body text (first 1000 chars):', bodyText.slice(0, 1000));

  process.exit(0);
};

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
}).finally(async () => {
  await closeAllContexts();
});
