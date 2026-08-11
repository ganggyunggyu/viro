/**
 * 사용법 가이드에 넣을 UI 캡처를 뜬다.
 * dev 서버(3097)가 떠 있어야 한다.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:3097';
const OUT_DIR = join(process.cwd(), 'docs', 'guide-shots');
const USER_ID = 'user-1768955529317'; // 21lab

interface Shot {
  name: string;
  path: string;
  waitMs?: number;
  action?: (page: import('playwright').Page) => Promise<void>;
}

const SHOTS: Shot[] = [
  { name: '01-comment-jobs', path: '/comment-jobs', waitMs: 2500 },
  {
    name: '02-comment-style',
    path: '/comment-jobs',
    waitMs: 2500,
    action: async (page) => {
      const btn = page.locator('button', { hasText: '티키타카 질문' }).first();
      if (await btn.count()) await btn.click();
      await page.waitForTimeout(500);
    },
  },
  {
    name: '03-comment-advanced',
    path: '/comment-jobs',
    waitMs: 2500,
    action: async (page) => {
      const summary = page.locator('text=운영자 도구').first();
      if (await summary.count()) await summary.click();
      await page.waitForTimeout(800);
    },
  },
  { name: '04-publish', path: '/publish', waitMs: 2500 },
  { name: '05-manual-post', path: '/manual-post', waitMs: 2500 },
  { name: '06-queue', path: '/queue', waitMs: 2500 },
];

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addCookies([
    { name: 'cafe-bot-user-id', value: USER_ID, url: BASE },
  ]);

  const page = await context.newPage();

  for (const shot of SHOTS) {
    await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(shot.waitMs ?? 2000);
    if (shot.action) await shot.action(page);

    const file = join(OUT_DIR, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`저장: ${file}`);
  }

  await browser.close();
  console.log(`\n총 ${SHOTS.length}장 → ${OUT_DIR}`);
  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
