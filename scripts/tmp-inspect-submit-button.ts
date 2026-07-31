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
  await page.goto(CREATE_CAFE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  await fillCafeIdentity(page, '맛집 미식노트', 'gourmetnote704');
  await setCafeVisibilityDefaults(page);
  await selectCafeTopic(page, '생활', '맛집');
  await fillCafeDescription(page, '여기저기 다녀본 맛집과 메뉴 후기를 편하게 기록하고 나누는 공간입니다.');
  await addCafeSearchKeywords(page, ['맛집', '맛집추천', '맛집후기', '맛집리스트', '맛집정보']);
  await agreeToCafePolicy(page);
  await solveCafeCreateCaptcha(page);

  // Dump ALL elements matching "만들기" text with their outerHTML/attrs
  const matches = await page.evaluate(() => {
    const results: Array<{ tag: string; class: string; text: string; visible: boolean; html: string }> = [];
    const all = document.querySelectorAll('a, button');
    all.forEach((el) => {
      const text = el.textContent?.trim() || '';
      if (text.includes('만들기')) {
        const rect = el.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0;
        results.push({
          tag: el.tagName,
          class: el.className,
          text,
          visible,
          html: el.outerHTML.slice(0, 300),
        });
      }
    });
    return results;
  });

  console.log('=== ALL "만들기" MATCHES ===');
  console.log(JSON.stringify(matches, null, 2));

  process.exit(0);
};

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
}).finally(async () => {
  await closeAllContexts();
});
