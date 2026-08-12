/**
 * 발 건강 원고 발행분 8건의 댓글 작업 진행 상황을 확인한다.
 *
 *   npx tsx --env-file=.env.local scripts/check-foot-health-comments.ts
 */
import mongoose from 'mongoose';
import { ManualCommentJob } from '../src/shared/models';

const SLUGS = [
  'carelog702',
  'habitnote702',
  'healthcheck702',
  'healthinfo702',
  'healthhhh',
  'purplevhkwm',
  'infomadang702',
  'livingnote702',
];

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

  const jobs = await ManualCommentJob.find({ cafeSlug: { $in: SLUGS }, mode: 'fixed' })
    .sort({ createdAt: -1 })
    .limit(SLUGS.length)
    .select('cafeSlug articleId status results claimedBy errorMessage')
    .lean<Array<{
      cafeSlug: string;
      articleId: number;
      status: string;
      results?: Array<{ success: boolean }>;
      claimedBy?: string;
      errorMessage?: string;
    }>>();

  let doneCount = 0;
  let successTotal = 0;

  for (const job of jobs) {
    const success = (job.results || []).filter(({ success: ok }) => ok).length;
    const failed = (job.results || []).filter(({ success: ok }) => !ok).length;
    successTotal += success;
    if (job.status === 'done') doneCount += 1;
    console.log(
      `${`${job.cafeSlug}/${job.articleId}`.padEnd(22)} ${job.status.padEnd(8)} 성공${success} 실패${failed} ${job.claimedBy || ''} ${job.errorMessage || ''}`.trimEnd(),
    );
  }

  console.log(`\n완료 ${doneCount}/${jobs.length} · 등록된 댓글 ${successTotal}개`);
  await mongoose.disconnect();
};

main().catch((error) => {
  console.error('FATAL:', error instanceof Error ? error.message : error);
  process.exit(1);
});
