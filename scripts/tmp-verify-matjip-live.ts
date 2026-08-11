import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { browseCafePosts } from '../src/shared/lib/cafe-browser';
import { readCafeArticleContent } from '../src/shared/lib/cafe-article-reader';

const LAB_USER_ID = 'user-1768955529317';
const CAFE_IDS = ['31766236', '31766237', '31766238'];

const toKstDateKey = (ts: number): string =>
  new Date(ts + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

const main = async () => {
  await connectDB();
  const today = toKstDateKey(Date.now());

  for (const cafeId of CAFE_IDS) {
    const cafe = await Cafe.findOne({ userId: LAB_USER_ID, cafeId }).lean();
    if (!cafe?.ownerAccountId) continue;
    const account = await Account.findOne({ accountId: cafe.ownerAccountId, userId: LAB_USER_ID }).lean();
    if (!account) continue;

    const naverAccount = {
      id: account.accountId,
      password: account.password,
      nickname: account.nickname,
    };

    const listed = await browseCafePosts(naverAccount, cafeId, undefined, {
      page: 1,
      perPage: 20,
      cafeUrl: cafe.cafeUrl,
    });

    console.log(`\n===== ${cafe.name} (${cafeId}) =====`);
    if (!listed.success) {
      console.log(`  목록 조회 실패: ${listed.error}`);
      continue;
    }

    const todays = listed.articles.filter((a) => toKstDateKey(a.writeDateTimestamp) === today);
    console.log(`  오늘(${today}) 발행 ${todays.length}건`);

    for (const article of todays) {
      const read = await readCafeArticleContent(naverAccount, cafeId, article.articleId, {
        reason: 'verify_matjip',
      });
      if (!read.success) {
        console.log(`  #${article.articleId} 본문 읽기 실패: ${read.error}`);
        continue;
      }
      const plain = (read.content || '').replace(/<[^>]+>/g, '').replace(/\s/g, '');
      const imageCount = (read.content || '').match(/<img|이미지|\.jpg|\.png/gi)?.length ?? 0;
      console.log(`  #${article.articleId} "${read.title}"`);
      console.log(`     작성자=${read.authorNickname} · 본문 ${plain.length}자 · 이미지흔적 ${imageCount}`);
      console.log(`     첫줄: ${(read.content || '').replace(/<[^>]+>/g, ' ').trim().slice(0, 70)}`);
    }
  }

  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
