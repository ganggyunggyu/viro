import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { getPageForAccount, isAccountLoggedIn, loginAccount, closeAllContexts } from '../src/shared/lib/multi-session';

const CHECKS: Array<{ accountId: string; slug: string }> = [
  { accountId: 'angrykoala270', slug: 'gourmetnote702' },
  { accountId: 'geenl', slug: 'mealdiary702' },
  { accountId: 'cothdals1001', slug: 'tastetrip702' },
];

const main = async () => {
  await connectDB();

  for (const { accountId, slug } of CHECKS) {
    const account = await Account.findOne({ accountId }).lean();
    if (!account) {
      console.log(slug, '-> account not found');
      continue;
    }
    if (!(await isAccountLoggedIn(accountId))) {
      await loginAccount(accountId, account.password);
    }
    const page = await getPageForAccount(accountId);
    await page.goto(`https://cafe.naver.com/${slug}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const title = await page.title().catch(() => '');
    const url = page.url();
    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 300) || '').catch(() => '');
    console.log(`\n=== ${slug} (${accountId}) ===`);
    console.log('title:', title);
    console.log('final url:', url);
    console.log('body preview:', bodyText.replace(/\n+/g, ' | ').slice(0, 300));
  }

  process.exit(0);
};

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
}).finally(async () => {
  await closeAllContexts();
});
