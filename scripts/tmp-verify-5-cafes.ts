import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { Cafe } from '../src/shared/models/cafe';
import { getCommenterAccounts } from '../src/shared/config/accounts';
import { browseCafePosts } from '../src/shared/lib/cafe-browser';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const TARGET_NAMES = ['가중건다', '운연정', '이모저모모여라', '생활 살림노트', '주차파크시티'];

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const viewers = (await getCommenterAccounts(user.userId)).filter((a) => !a.excludeFromAutoComment);

  console.log(`[VERIFY-5] ${TARGET_NAMES.length}개 카페 상세 점검 시작\n`);

  for (let i = 0; i < TARGET_NAMES.length; i++) {
    const name = TARGET_NAMES[i];
    const cafe = await Cafe.findOne({ name }).lean();
    if (!cafe) {
      console.log(`[${name}] 카페 정보 없음`);
      continue;
    }
    const viewer = viewers[i % viewers.length];
    const articlesById = new Map();

    for (let page = 1; page <= 3; page++) {
      const browsed = await browseCafePosts(viewer, cafe.cafeId, undefined, {
        page,
        perPage: 20,
        cafeUrl: cafe.cafeUrl,
      });
      if (!browsed.success || browsed.articles.length === 0) break;
      for (const a of browsed.articles) {
        articlesById.set(a.articleId, a);
      }
    }

    const sorted = [...articlesById.values()].sort((a, b) => b.articleId - a.articleId);
    const zero = sorted.filter((a) => a.commentCount === 0);
    const low = sorted.filter((a) => a.commentCount > 0 && a.commentCount <= 3);

    console.log(`\n[${name}] (${cafe.cafeUrl}) 조회 ${sorted.length}개 - 댓글0개 ${zero.length}, 부족(1~3) ${low.length}`);
    for (const a of sorted.slice(0, 15)) {
      const dateStr = new Date(a.writeDateTimestamp).toISOString();
      console.log(`  #${a.articleId} 댓글${a.commentCount}개 - ${a.subject} (${dateStr})`);
    }
  }
};

main()
  .catch((error) => {
    console.error('verify-5 failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeAllContexts();
    await mongoose.disconnect();
  });
