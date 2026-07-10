/**
 * 등록된 모든 카페의 최신글 리스트(모바일)를 스크린샷으로 저장한다.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/screenshot-all-cafe-lists.ts <출력디렉토리>
 */

import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { getAllCafes } from '../src/shared/config/cafes';
import { getCommenterAccounts } from '../src/shared/config/accounts';
import {
  acquireAccountLock,
  releaseAccountLock,
  loginAccount,
  isAccountLoggedIn,
  getPageForAccount,
  closeAllContexts,
} from '../src/shared/lib/multi-session';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const OUT_DIR = process.argv[2] || '.';

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const cafes = await getAllCafes(user.userId);
  const viewers = await getCommenterAccounts(user.userId);
  const viewer = viewers.find((a) => !a.excludeFromAutoComment) || viewers[0];
  if (!viewer) throw new Error('조회용 commenter 계정 없음');

  console.log(`[SHOT] 계정 ${viewer.id}로 카페 ${cafes.length}개 캡쳐 시작`);

  await acquireAccountLock(viewer.id);
  try {
    const loggedIn = await isAccountLoggedIn(viewer.id);
    if (!loggedIn) {
      const r = await loginAccount(viewer.id, viewer.password, { waitForLoginMs: 60000, reason: 'screenshot_all_cafe_lists' });
      if (!r.success) throw new Error(`로그인 실패: ${r.error}`);
    }

    const page = await getPageForAccount(viewer.id);

    for (const cafe of cafes) {
      const slug = cafe.cafeUrl.replace(/^https?:\/\/cafe\.naver\.com\//i, '').replace(/\/$/, '');
      const outPath = `${OUT_DIR}/cafe-${slug}.png`;

      try {
        await page.goto(`https://m.cafe.naver.com/${slug}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2500);
        await page.screenshot({ path: outPath, fullPage: false });
        console.log(`[SHOT] ${cafe.name} (${slug}) → ${outPath}`);
      } catch (error) {
        console.error(`[SHOT] 실패 ${cafe.name} (${slug}):`, error instanceof Error ? error.message : error);
      }
    }
  } finally {
    releaseAccountLock(viewer.id);
  }

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error('ERROR:', e instanceof Error ? e.message : e);
    try { await closeAllContexts(); } catch {}
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  });
