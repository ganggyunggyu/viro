/**
 * 생활 살림노트에서 owner 계정이 왜 글쓰기 페이지에 못 들어가는지 확인한다.
 * 로그인 → 글쓰기 URL 이동 → 실제로 어디로 튕기는지 캡처.
 */
import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import {
  getPageForAccount,
  loginAccount,
  isAccountLoggedIn,
  acquireAccountLock,
  releaseAccountLock,
  closeAllContexts,
} from '../src/shared/lib/multi-session';
import { mkdirSync } from 'fs';
import { join } from 'path';

const UID = 'user-1768955529317';
const CAFE_ID = '31754939'; // 생활 살림노트
const OUT_DIR = join(process.cwd(), 'debug-shots', 'diag');

const main = async () => {
  await connectDB();
  mkdirSync(OUT_DIR, { recursive: true });

  const cafe = await Cafe.findOne({ userId: UID, cafeId: CAFE_ID }).lean();
  const acc = await Account.findOne({ accountId: cafe?.ownerAccountId }).lean();
  if (!cafe || !acc) {
    console.log('카페/계정 없음');
    process.exit(1);
  }

  console.log(`카페: ${cafe.name} (${cafe.cafeUrl}) / 계정: ${acc.accountId} (${acc.nickname})`);

  await acquireAccountLock(acc.accountId);
  try {
    if (!(await isAccountLoggedIn(acc.accountId))) {
      const r = await loginAccount(acc.accountId, acc.password, { reason: 'diag' });
      console.log(`로그인: ${r.success ? '성공' : '실패 - ' + r.error}`);
      if (!r.success) return;
    } else {
      console.log('로그인: 캐시 히트');
    }

    const page = await getPageForAccount(acc.accountId);

    // 1) 카페 메인
    await page.goto(`https://cafe.naver.com/${cafe.cafeUrl.replace('https://cafe.naver.com/', '')}`, {
      waitUntil: 'domcontentloaded',
      timeout: 40000,
    });
    await page.waitForTimeout(3000);
    console.log(`카페 메인 URL: ${page.url()}`);
    await page.screenshot({ path: join(OUT_DIR, 'livingnote-main.png') });

    // 글쓰기 버튼이 보이는지
    const writeBtn = await page.$$eval('a, button', (nodes) =>
      nodes
        .map((n) => (n.textContent || '').trim())
        .filter((t) => t.includes('글쓰기'))
        .slice(0, 5),
    ).catch(() => []);
    console.log(`글쓰기 버튼 텍스트: ${JSON.stringify(writeBtn)}`);

    // 2) 글쓰기 페이지 직접 이동
    const writeUrl = `https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/write`;
    await page.goto(writeUrl, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.waitForTimeout(4000);
    console.log(`글쓰기 이동 후 URL: ${page.url()}`);
    await page.screenshot({ path: join(OUT_DIR, 'livingnote-write.png') });

    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 400)).catch(() => '');
    console.log(`화면 텍스트 앞부분:\n${bodyText}`);
  } finally {
    releaseAccountLock(acc.accountId);
  }

  await closeAllContexts();
  process.exit(0);
};

main().catch(async (e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  await closeAllContexts();
  process.exit(1);
});
