/**
 * 누락된 댓글 미달글을 generate(5~13개) 잡으로 큐에 등록 + 기존 pending 잡 5~13으로 하향.
 *
 * - 본문/제목 기반 자연 흐름 댓글은 worker의 generateCafeCommentBatch(body+keyword)가 처리.
 * - 이미 pending/running/done 잡이 있는 글은 건너뜀(과다 댓글 방지).
 *
 * Usage: npx tsx --env-file=.env.local scripts/enqueue-missing-low-comment-513.ts
 */

import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { ManualCommentJob } from '../src/shared/models';
import { createManualCommentJobRecord } from '../src/features/manual-comment-job/actions';

const GEN_MIN = 5;
const GEN_MAX = 13;

const TARGETS: Array<{ cafeId: string; cafeSlug: string; articleIds: number[] }> = [
  { cafeId: '31754939', cafeSlug: 'livingnote702', articleIds: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { cafeId: '31755069', cafeSlug: 'dailychat702', articleIds: [3, 4, 5, 6, 7, 8, 9, 10] },
];

const buildArticleUrl = (cafeId: string, articleId: number): string =>
  `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: '21lab', isActive: true }).lean();
  if (!user) throw new Error('user not found');
  const userId = (user as { userId: string }).userId;

  // 1) 기존 pending generate 잡 5~13으로 하향
  const updated = await ManualCommentJob.updateMany(
    { userId, status: 'pending', mode: 'generate' },
    { $set: { generateMinCount: GEN_MIN, generateMaxCount: GEN_MAX } },
  );
  console.log(`[UPDATE] pending generate 잡 ${updated.modifiedCount}건 → gen ${GEN_MIN}-${GEN_MAX} 하향`);

  // 2) 누락 글 큐 등록 (기존 pending/running/done 잡 있으면 스킵)
  let queued = 0;
  let skipped = 0;
  for (const t of TARGETS) {
    for (const articleId of t.articleIds) {
      const existing = await ManualCommentJob.findOne({
        userId,
        cafeId: t.cafeId,
        articleId,
        status: { $in: ['pending', 'running', 'done'] },
      }).lean();
      if (existing) {
        console.log(`  - ${t.cafeSlug}/${articleId}: 이미 잡 존재(${(existing as { status: string }).status}) 스킵`);
        skipped += 1;
        continue;
      }

      const articleUrl = buildArticleUrl(t.cafeId, articleId);
      const created = await createManualCommentJobRecord(
        userId,
        { articleUrl, cafeSlug: t.cafeSlug, cafeId: t.cafeId, articleId },
        {
          articleUrl,
          mode: 'generate',
          generateMinCount: GEN_MIN,
          generateMaxCount: GEN_MAX,
          delayMinMinutes: 3,
          delayMaxMinutes: 8,
        },
      );
      if (created.success) {
        console.log(`  + ${t.cafeSlug}/${articleId} → jobId=${created.jobId}`);
        queued += 1;
      } else {
        console.log(`  ! ${t.cafeSlug}/${articleId}: 등록 실패 ${created.error}`);
        skipped += 1;
      }
    }
  }

  console.log(`\n[DONE] 신규 등록 ${queued}건, 스킵 ${skipped}건`);
  await mongoose.disconnect();
};

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
