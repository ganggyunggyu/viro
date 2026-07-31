import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { getAllCafes } from '../src/shared/config/cafes';
import { getCommenterAccounts } from '../src/shared/config/accounts';
import { browseCafePosts } from '../src/shared/lib/cafe-browser';
import { ManualCommentJob } from '../src/shared/models/manual-comment-job';
import { createManualCommentJobRecord } from '../src/features/manual-comment-job/actions';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const CUTOFF_MS = new Date('2026-07-20T00:00:00+09:00').getTime();
const MAX_COMMENT_COUNT = 3;

const buildArticleUrl = (cafeId: string, articleId: number): string =>
  `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const cafes = await getAllCafes(user.userId);
  const viewers = (await getCommenterAccounts(user.userId)).filter((a) => !a.excludeFromAutoComment);

  console.log(`[BACKFILL] 카페 ${cafes.length}개, 7/20 이후 저조 댓글 글 gap 확인+큐잉 시작\n`);

  let queued = 0;
  let alreadyActive = 0;
  let alreadyDoneButLive0 = 0;

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

    const flagged = [...articlesById.entries()].filter(([, info]) => info.commentCount <= MAX_COMMENT_COUNT);
    if (flagged.length === 0) continue;

    for (const [articleId, info] of flagged) {
      const existingActive = await ManualCommentJob.findOne({
        userId: user.userId,
        cafeId: cafe.cafeId,
        articleId,
        status: { $in: ['pending', 'running'] },
      }).lean();

      if (existingActive) {
        alreadyActive++;
        continue;
      }

      const existingDone = await ManualCommentJob.findOne({
        userId: user.userId,
        cafeId: cafe.cafeId,
        articleId,
        status: 'done',
      }).lean();

      if (existingDone && info.commentCount === 0) {
        alreadyDoneButLive0++;
        console.log(`  [재큐잉] ${cafe.name} #${articleId} - done 기록 있으나 라이브 댓글 0개: ${info.subject}`);
      } else if (existingDone) {
        continue;
      }

      const articleUrl = buildArticleUrl(cafe.cafeId, articleId);
      const created = await createManualCommentJobRecord(
        user.userId,
        { articleUrl, cafeSlug: cafe.cafeUrl, cafeId: cafe.cafeId, articleId },
        {
          articleUrl,
          mode: 'generate',
          generateMinCount: 5,
          generateMaxCount: 7,
          delayMinMinutes: 0.33,
          delayMaxMinutes: 0.5,
        },
      );

      if (created.success) {
        queued++;
        console.log(`  + ${cafe.name} #${articleId} (댓글 ${info.commentCount}개) → jobId=${created.jobId}`);
      } else {
        console.log(`  ! ${cafe.name} #${articleId} 큐잉 실패: ${created.error}`);
      }
    }
  }

  console.log(`\n[BACKFILL] 신규 큐잉 ${queued}건, 이미 대기/진행중 ${alreadyActive}건, done인데 라이브 0개(재큐잉 포함) ${alreadyDoneButLive0}건`);
};

main()
  .catch((error) => {
    console.error('backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeAllContexts();
    await mongoose.disconnect();
  });
