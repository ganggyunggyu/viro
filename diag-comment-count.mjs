import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const cookies = JSON.parse(
  readFileSync(
    '/Users/ganggyunggyu/Programing/cafe-bot/.playwright-session/produce11745-cookies.json',
    'utf-8',
  ),
);

const CAFE_ID = '31750099'; // mealtalkdht
const ARTICLE_ID = 44;

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies(cookies);
  const page = await context.newPage();

  await page.goto('https://cafe.naver.com/mealtalkdht', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);

  const apiUrl = [
    'https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json',
    `?search.clubid=${CAFE_ID}`,
    '&search.page=1',
    '&search.perPage=20',
    '&search.queryType=lastArticle',
    '&search.boardtype=L',
  ].join('');

  const apiResult = await page.evaluate(async (url) => {
    const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
    return await res.json();
  }, apiUrl);

  const list = apiResult?.message?.result?.articleList || [];
  console.log('=== API articleList sample (first 5) ===');
  console.log(JSON.stringify(list.slice(0, 5).map((a) => ({
    articleId: a.articleId,
    subject: a.subject,
    commentCount: a.commentCount,
    menuId: a.menuId,
    menuName: a.menuName,
  })), null, 2));

  const target = list.find((a) => a.articleId === ARTICLE_ID);
  console.log('=== target article raw JSON (articleId=' + ARTICLE_ID + ') ===');
  console.log(JSON.stringify(target, null, 2));

  // Now navigate to the actual article page and read real comment count
  const articleUrl = `https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/${ARTICLE_ID}`;
  await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2500);

  const domInfo = await page.evaluate(() => {
    const grabText = (sel) => Array.from(document.querySelectorAll(sel)).map((n) => n.textContent?.trim());
    return {
      url: location.href,
      title: document.title,
      commentButtons: grabText('.button_comment, .comment_count, .num_comment, a[href="#comment"]'),
      bodyPreview: document.body.innerText.slice(0, 2000),
    };
  });
  console.log('=== DOM check on actual article page ===');
  console.log('final URL:', domInfo.url);
  console.log('commentButtons:', domInfo.commentButtons);
  console.log('bodyPreview:', domInfo.bodyPreview);

  await page.screenshot({ path: '/private/tmp/claude-501/-Users-ganggyunggyu-Programing-cafe-bot--claude-worktrees-fervent-blackburn-f0ef0e/0a3e62d8-abc9-41cf-a3ec-5c2ab38eafde/scratchpad/article-44.png', fullPage: true });

  await browser.close();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
