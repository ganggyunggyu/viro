import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { getPageForAccount, isAccountLoggedIn, loginAccount, closeAllContexts } from '../src/shared/lib/multi-session';
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

  page.on('request', (req) => {
    if (req.method() === 'POST' || /create|cafe/i.test(req.url())) {
      console.log('[REQ]', req.method(), req.url());
    }
  });
  page.on('response', (res) => {
    if (res.request().method() === 'POST' || /create/i.test(res.url())) {
      console.log('[RES]', res.status(), res.url());
    }
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[CONSOLE ERROR]', msg.text());
  });

  await page.goto(CREATE_CAFE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  await fillCafeIdentity(page, '맛집 미식노트', 'gourmetnote706');
  await setCafeVisibilityDefaults(page);
  await selectCafeTopic(page, '생활', '맛집');
  await fillCafeDescription(page, '여기저기 다녀본 맛집과 메뉴 후기를 편하게 기록하고 나누는 공간입니다.');
  await addCafeSearchKeywords(page, ['맛집', '맛집추천', '맛집후기', '맛집리스트', '맛집정보']);
  await agreeToCafePolicy(page);
  await solveCafeCreateCaptcha(page);

  const btn = page.locator('a.BaseButton--green:has-text("만들기")').last();
  console.log('button count matching selector:', await page.locator('a.BaseButton--green:has-text("만들기")').count());
  console.log('button visible:', await btn.isVisible());
  console.log('button enabled:', await btn.isEnabled());

  console.log('=== clicking now ===');
  await btn.click();
  await page.waitForTimeout(8000);

  console.log('final url:', page.url());
  process.exit(0);
};

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
}).finally(async () => {
  await closeAllContexts();
});
