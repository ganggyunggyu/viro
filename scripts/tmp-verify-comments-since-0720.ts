import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { getAllCafes } from '../src/shared/config/cafes';
import { getCommenterAccounts } from '../src/shared/config/accounts';
import { browseCafePosts } from '../src/shared/lib/cafe-browser';
import { ManualCommentJob } from '../src/shared/models/manual-comment-job';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const CUTOFF_MS = new Date('2026-07-20T00:00:00+09:00').getTime();

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const cafes = await getAllCafes(user.userId);
  const viewers = (await getCommenterAccounts(user.userId)).filter((a) => !a.excludeFromAutoComment);

  console.log(`[VERIFY] 카페 ${cafes.length}개, 7/20 이후 게시글 댓글 상태 점검 시작\n`);

  let totalArticles = 0;
  let lowComment = 0;
  let zeroComment = 0;

  for (let i = 0; i < cafes.length; i++) {
    const cafe = cafes[i];
    const viewer = viewers[i % viewers.length];
    const articlesById = new Map<number, { subject: string; commentCount: number; writeDateTimestamp: number }>();

    for (let page = 1; page <= 3; page++) {
      const browsed = await browseCafePosts(viewer, cafe.cafeId, undefined, {
        page,
        perPage: 20,
        cafeUrl: cafe.cafeUrl,
      });
      if (!browsed.success || browsed.articles.length === 0) break;

      let sawOld = false;
      for (const a of browsed.articles) {
        if (a.writeDateTimestamp < CUTOFF_MS) {
          sawOld = true;
          continue;
        }
        articlesById.set(a.articleId, {
          subject: a.subject,
          commentCount: a.commentCount,
          writeDateTimestamp: a.writeDateTimestamp,
        });
      }
      if (sawOld) break;
    }

    const recent = [...articlesById.entries()].sort((a, b) => b[1].writeDateTimestamp - a[1].writeDateTimestamp);
    if (recent.length === 0) {
      console.log(`[${cafe.name || cafe.cafeUrl}] 7/20 이후 게시글 없음`);
      continue;
    }

    console.log(`\n[${cafe.name || cafe.cafeUrl}] 7/20 이후 게시글 ${recent.length}개`);
    for (const [articleId, info] of recent) {
      totalArticles++;
      const flag = info.commentCount === 0 ? ' *** 댓글 0개 ***' : info.commentCount <= 3 ? ' (부족)' : '';
      if (info.commentCount === 0) zeroComment++;
      else if (info.commentCount <= 3) lowComment++;
      const dateStr = new Date(info.writeDateTimestamp).toISOString();
      console.log(`  #${articleId} 댓글 ${info.commentCount}개${flag} - ${info.subject} (${dateStr})`);
    }
  }

  console.log(`\n[VERIFY] 총 ${totalArticles}건, 댓글 0개 ${zeroComment}건, 댓글 1~3개(부족) ${lowComment}건`);
};

main()
  .catch((error) => {
    console.error('verify failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeAllContexts();
    await mongoose.disconnect();
  });
