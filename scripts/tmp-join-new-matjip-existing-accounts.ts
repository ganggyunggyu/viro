import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { Account } from '../src/shared/models/account';
import { getAllCafes } from '../src/shared/config/cafes';
import {
  acquireAccountLock,
  releaseAccountLock,
  loginAccount,
  getPageForAccount,
  saveCookiesForAccount,
  closeAllContexts,
} from '../src/shared/lib/multi-session';
import { joinCafeMembership, type NaverCafeTarget } from '../src/shared/lib/naver-cafe-membership';

const LOGIN_ID = '21lab';
const NEW_CAFE_URLS = ['gourmetnote707', 'mealdiary702', 'tastetrip702'];
const BLOCKED_ACCOUNT_IDS = new Set([
  'godqhr5528', 'megatattoo', 'odori2007', 'busansmart', 'rational4640',
  'hugeda14713', 'ghhoy', 'loand3324', 'b6x2k9w3', '8ua1womn',
  'alstjs9711', 'jjs216', // 사용x
]);
const ALREADY_DONE_ACCOUNT_IDS = new Set(['dq1h3bjy', 'h9ag469z', 'hagyga', 'geenl']);

const joinOneAccount = async (
  accountId: string,
  password: string,
  nickname: string,
  cafes: Array<{ cafeId: string; cafeUrl: string; name: string }>,
): Promise<void> => {
  await acquireAccountLock(accountId);
  try {
    const loginResult = await loginAccount(accountId, password, {
      waitForLoginMs: 60000,
      reason: `join_new_matjip:${accountId}`,
    });
    if (!loginResult.success) {
      console.error(`[JOIN] ${accountId} 로그인 실패: ${loginResult.error}`);
      return;
    }

    const page = await getPageForAccount(accountId);
    for (const cafe of cafes) {
      const target: NaverCafeTarget = { cafeId: cafe.cafeId, cafeUrl: cafe.cafeUrl, name: cafe.name };
      try {
        const result = await joinCafeMembership(page, target, {
          nickname,
          logPrefix: `JOIN:${accountId}:${cafe.name}`,
        });
        console.log(`[JOIN] ${accountId} → ${cafe.name}: ${result.status} (${result.detail})`);
      } catch (error) {
        console.error(`[JOIN] ${accountId} → ${cafe.name} 실패:`, error instanceof Error ? error.message : error);
      }
      await page.waitForTimeout(1200);
    }

    await saveCookiesForAccount(accountId);
  } finally {
    releaseAccountLock(accountId);
  }
};

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const allCafes = await getAllCafes(user.userId);
  const cafes = allCafes.filter((c) => NEW_CAFE_URLS.some((slug) => c.cafeUrl.includes(slug)));
  console.log('target cafes:', cafes.map((c) => c.name).join(', '));

  const accounts = await Account.find({
    userId: user.userId,
    isActive: true,
    excludeFromAutoComment: { $ne: true },
  }).select('accountId password nickname').lean();

  const targets = accounts.filter(
    (a) => !BLOCKED_ACCOUNT_IDS.has(a.accountId) && !ALREADY_DONE_ACCOUNT_IDS.has(a.accountId),
  );

  console.log(`[JOIN-NEW-MATJIP] 계정 ${targets.length}개 x 카페 ${cafes.length}개`);

  const CONCURRENCY = 5;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map((acc) =>
        joinOneAccount(acc.accountId, acc.password, acc.nickname || acc.accountId, cafes),
      ),
    );
  }

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error('join-new-matjip failed:', e instanceof Error ? e.message : e);
    try { await closeAllContexts(); } catch {}
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  });
