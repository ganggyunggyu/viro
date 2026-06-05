import * as dotenv from 'dotenv';
import mongoose, { Schema } from 'mongoose';
import {
  acquireAccountLock,
  closeAllContexts,
  getPageForAccount,
  isAccountLoggedIn,
  loginAccount,
  releaseAccountLock,
} from '../src/shared/lib/multi-session';

dotenv.config({ path: '.env.local' });
dotenv.config();

const cafeId = process.env.CAFE_ID || '25636798';
const accountId = process.env.ACCOUNT_ID || 'fail5644';
const articleIds = (process.env.ARTICLE_IDS || '31876,31809,31791')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter(Boolean);

const Account =
  mongoose.models.InspectAccount ||
  mongoose.model(
    'InspectAccount',
    new Schema({}, { strict: false, collection: 'accounts' })
  );

const collectDom = async () => {
  return {
    url: location.href,
    title: document.title,
    hasCommentTextarea: Boolean(document.querySelector('textarea.comment_inbox_text')),
    hasCommentItem: document.querySelectorAll('.CommentItem').length,
    hasMine: document.querySelectorAll('.CommentItem--mine').length,
    body: document.body.innerText.replace(/\s+/g, ' ').slice(0, 900),
    candidates: Array.from(document.querySelectorAll('button, a')).map((el, index) => ({
      index,
      tag: el.tagName,
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100),
      aria: el.getAttribute('aria-label') || '',
      cls: (el.getAttribute('class') || '').slice(0, 120),
      href: (el as HTMLAnchorElement).href || '',
    })).filter((item) => {
      const value = `${item.text} ${item.aria} ${item.cls} ${item.href}`;
      return /삭제|수정|신고|더보기|옵션|설정|menu|more|tool|comment|Comment|Article|댓글/.test(value);
    }).slice(0, 50),
  };
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI가 필요합니다.');
  await mongoose.connect(process.env.MONGODB_URI);
  const account = await Account.findOne({ accountId }).lean<{ password: string }>();
  if (!account) throw new Error(`계정 없음: ${accountId}`);

  await acquireAccountLock(accountId);
  try {
    if (!(await isAccountLoggedIn(accountId))) {
      const login = await loginAccount(accountId, account.password, { reason: 'inspect-cafe-article-dom' });
      if (!login.success) throw new Error(login.error);
    }
    const page = await getPageForAccount(accountId);

    for (const articleId of articleIds) {
      for (const url of [
        `https://m.cafe.naver.com/ArticleRead.nhn?clubid=${cafeId}&articleid=${articleId}&boardtype=L`,
        `https://cafe.naver.com/ArticleRead.nhn?clubid=${cafeId}&articleid=${articleId}&boardtype=L`,
        `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`,
      ]) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(4500);
        console.log(`\n===== ${articleId} ${url} =====`);
        console.log(JSON.stringify(await page.evaluate(collectDom), null, 2));

        const clicked = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
          const matches = els.filter((el) => {
            const value = `${el.textContent || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('class') || ''}`;
            return /더보기|옵션|more|tool|menu/.test(value);
          }).slice(0, 12);
          matches.forEach((el) => el.click());
          return matches.length;
        });
        await page.waitForTimeout(1200);
        console.log(`----- after clicking option candidates (${clicked}) -----`);
        console.log(JSON.stringify(await page.evaluate(collectDom), null, 2));
      }
    }
  } finally {
    releaseAccountLock(accountId);
    await closeAllContexts();
    await mongoose.disconnect();
  }
};

main().catch(async (error) => {
  console.error(error);
  await closeAllContexts().catch(() => {});
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
