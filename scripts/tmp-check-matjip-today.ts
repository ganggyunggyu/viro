import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { browseCafePosts } from '../src/shared/lib/cafe-browser';

const LAB_USER_ID = 'user-1768955529317';

const toKstDateKey = (ts: number): string => {
  const d = new Date(ts + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
};

const main = async () => {
  await connectDB();
  const today = toKstDateKey(Date.now());
  console.log(`오늘(KST): ${today}`);

  const cafes = await Cafe.find({ userId: LAB_USER_ID, name: /맛집/ }).lean();

  for (const cafe of cafes) {
    const account = await Account.findOne({ accountId: cafe.ownerAccountId, userId: LAB_USER_ID }).lean();
    if (!account) {
      console.log(`\n[${cafe.name}] owner 계정 없음: ${cafe.ownerAccountId}`);
      continue;
    }
    const r = await browseCafePosts(
      { id: account.accountId, password: account.password, nickname: account.nickname },
      cafe.cafeId,
      undefined,
      { page: 1, perPage: 20, cafeUrl: cafe.cafeUrl },
    );
    console.log(`\n===== ${cafe.name} (${cafe.cafeId}) owner=${cafe.ownerAccountId} =====`);
    if (!r.success) {
      console.log(`  조회 실패: ${r.error}`);
      continue;
    }
    const todays = r.articles.filter((a) => toKstDateKey(a.writeDateTimestamp) === today);
    console.log(`  오늘 발행: ${todays.length}건`);
    todays.forEach((a) => console.log(`    - #${a.articleId} ${a.subject}`));
  }

  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
