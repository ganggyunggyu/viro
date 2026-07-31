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
const NEW_ACCOUNT_IDS = [
  'godqhr5528', 'megatattoo', 'odori2007', 'busansmart', 'rational4640',
  'hugeda14713', 'h9ag469z', 'dq1h3bjy', 'hagyga', 'ghhoy',
  'loand3324', 'b6x2k9w3', '8ua1womn',
];

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
      reason: `join_all_cafes:${accountId}`,
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

  const cafes = await getAllCafes(user.userId);
  const accounts = await Account.find({
    userId: user.userId,
    accountId: { $in: NEW_ACCOUNT_IDS },
  }).select('accountId password nickname').lean();

  console.log(`[JOIN-ALL] 계정 ${accounts.length}개 x 카페 ${cafes.length}개`);

  // 이전에 동시성 19로 브라우저를 띄웠다가 메모리 부족으로 로그인/캡차가 전부 타임아웃난 적이
  // 있어서(2026-07-22), 안정적으로 확인된 동시성 5로 배치 처리한다.
  const CONCURRENCY = 5;
  for (let i = 0; i < accounts.length; i += CONCURRENCY) {
    const batch = accounts.slice(i, i + CONCURRENCY);
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
    console.error('join-all-cafes failed:', e instanceof Error ? e.message : e);
    try { await closeAllContexts(); } catch {}
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  });
