/**
 * 신규 카페에 commenter 계정 일부를 가입시킨다 (댓글 작업 실행 전 선행 작업).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/join-new-cafes.ts <cafeId1,cafeId2,...> <가입시킬 계정 수>
 */

import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { getAllCafes } from '../src/shared/config/cafes';
import { getCommenterAccounts } from '../src/shared/config/accounts';
import {
  acquireAccountLock,
  releaseAccountLock,
  loginAccount,
  getPageForAccount,
  saveCookiesForAccount,
  closeAllContexts,
} from '../src/shared/lib/multi-session';
import { joinCafeMembership, type NaverCafeTarget } from '../src/shared/lib/naver-cafe-membership';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const TARGET_CAFE_IDS = (process.argv[2] || '').split(',').map((s) => s.trim()).filter(Boolean);
const ACCOUNT_COUNT = Number(process.argv[3]) || 6;

const main = async (): Promise<void> => {
  if (TARGET_CAFE_IDS.length === 0) throw new Error('cafeId 목록을 인자로 넘겨주세요');
  await mongoose.connect(process.env.MONGODB_URI!);

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const cafes = (await getAllCafes(user.userId)).filter((c) => TARGET_CAFE_IDS.includes(c.cafeId));
  const commenters = (await getCommenterAccounts(user.userId))
    .filter((a) => !a.excludeFromAutoComment)
    .slice(0, ACCOUNT_COUNT);

  console.log(`[JOIN] 대상 카페 ${cafes.length}개, 가입시킬 계정 ${commenters.length}개`);

  for (const account of commenters) {
    await acquireAccountLock(account.id);
    try {
      const loginResult = await loginAccount(account.id, account.password, {
        waitForLoginMs: 60000,
        reason: `join_new_cafes:${account.id}`,
      });
      if (!loginResult.success) {
        console.error(`[JOIN] ${account.id} 로그인 실패: ${loginResult.error}`);
        continue;
      }

      const page = await getPageForAccount(account.id);

      for (const cafe of cafes) {
        const target: NaverCafeTarget = {
          cafeId: cafe.cafeId,
          cafeUrl: cafe.cafeUrl,
          name: cafe.name,
        };

        try {
          const result = await joinCafeMembership(page, target, {
            nickname: account.nickname || account.id,
            logPrefix: `JOIN:${account.id}:${cafe.name}`,
          });
          console.log(`[JOIN] ${account.id} → ${cafe.name}: ${result.status} (${result.detail})`);
        } catch (error) {
          console.error(`[JOIN] ${account.id} → ${cafe.name} 실패:`, error instanceof Error ? error.message : error);
        }
        await page.waitForTimeout(1500);
      }

      await saveCookiesForAccount(account.id);
    } finally {
      releaseAccountLock(account.id);
    }
  }

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error('join-new-cafes failed:', e instanceof Error ? e.message : e);
    try { await closeAllContexts(); } catch {}
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  });
