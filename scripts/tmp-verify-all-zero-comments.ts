import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { getAllCafes } from '../src/shared/config/cafes';
import { getCommenterAccounts } from '../src/shared/config/accounts';
import { browseCafePosts } from '../src/shared/lib/cafe-browser';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const PAGES_PER_CAFE = 3;

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const cafes = await getAllCafes(user.userId);
  const viewers = (await getCommenterAccounts(user.userId)).filter((a) => !a.excludeFromAutoComment);

  console.log(`[VERIFY-ALL] 카페 ${cafes.length}개, 전체 최근 글(최대 ${PAGES_PER_CAFE * 20}개/카페) 댓글 0개 점검 시작\n`);

  let totalArticles = 0;
  let zeroComment = 0;

  for (let i = 0; i < cafes.length; i++) {
    const cafe = cafes[i];
    const viewer = viewers[i % viewers.length];
    const articlesById = new Map<number, { subject: string; commentCount: number; writeDateTimestamp: number }>();

    for (let page = 1; page <= PAGES_PER_CAFE; page++) {
      const browsed = await browseCafePosts(viewer, cafe.cafeId, undefined, {
        page,
        perPage: 20,
        cafeUrl: cafe.cafeUrl,
      });
      if (!browsed.success || browsed.articles.length === 0) break;

      for (const a of browsed.articles) {
        articlesById.set(a.articleId, {
          subject: a.subject,
          commentCount: a.commentCount,
          writeDateTimestamp: a.writeDateTimestamp,
        });
      }
    }

    const zeros = [...articlesById.entries()]
      .filter(([, info]) => info.commentCount === 0)
      .sort((a, b) => b[1].writeDateTimestamp - a[1].writeDateTimestamp);

    totalArticles += articlesById.size;
    if (zeros.length === 0) continue;

    console.log(`\n[${cafe.name || cafe.cafeUrl}] 조회 ${articlesById.size}개 중 댓글 0개 ${zeros.length}개`);
    for (const [articleId, info] of zeros) {
      zeroComment++;
      const dateStr = new Date(info.writeDateTimestamp).toISOString();
      console.log(`  #${articleId} - ${info.subject} (${dateStr})`);
    }
  }

  console.log(`\n[VERIFY-ALL] 총 조회 ${totalArticles}건, 댓글 0개 ${zeroComment}건`);
};

main()
  .catch((error) => {
    console.error('verify-all failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeAllContexts();
    await mongoose.disconnect();
  });
