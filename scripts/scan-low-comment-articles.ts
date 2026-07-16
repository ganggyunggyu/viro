/**
 * 댓글 부족 글 스캔 스크립트
 *
 * 등록된 모든 카페를 순회하며 댓글수 <= 3인 글을 찾아
 * manual-comment-job(생성 모드, 5~7개)을 큐에 등록한다.
 * 실제 댓글 작성은 scripts/run-manual-comment-worker.ts가 폴링하며 처리한다.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/scan-low-comment-articles.ts
 *   LOGIN_ID=21lab MAX_COMMENT_COUNT=3 npx tsx --env-file=.env.local scripts/scan-low-comment-articles.ts
 */

import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { scanLowCommentArticles } from '../src/features/manual-comment-job/low-comment-scan';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const MONGODB_URI = process.env.MONGODB_URI!;
const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const MAX_COMMENT_COUNT = Number(process.env.MAX_COMMENT_COUNT) || 3;
const GEN_MIN_COUNT = Number(process.env.GEN_MIN_COUNT) || 5;
const GEN_MAX_COUNT = Number(process.env.GEN_MAX_COUNT) || 7;

const main = async (): Promise<void> => {
  if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  console.log(`[SCAN] 시작 (user: ${LOGIN_ID}, 댓글 ${MAX_COMMENT_COUNT}개 이하 대상)`);

  const result = await scanLowCommentArticles(user.userId, {
    maxCommentCount: MAX_COMMENT_COUNT,
    generateMinCount: GEN_MIN_COUNT,
    generateMaxCount: GEN_MAX_COUNT,
  });

  console.log(`\n[SCAN] 카페 ${result.scannedCafes}개 스캔 완료`);
  console.log(`[SCAN] 대상 글 ${result.foundArticles.length}개 발견`);
  for (const article of result.foundArticles) {
    console.log(`  - ${article.cafeSlug}/${article.articleId} (댓글 ${article.commentCount}개) ${article.articleUrl}`);
  }

  console.log(`\n[SCAN] 신규 등록 ${result.queuedJobs.length}건`);
  for (const job of result.queuedJobs) {
    console.log(`  + ${job.cafeSlug}/${job.articleId} → jobId=${job.jobId}`);
  }

  if (result.skipped.length > 0) {
    console.log(`\n[SCAN] 스킵 ${result.skipped.length}건`);
    for (const s of result.skipped) {
      console.log(`  - ${s.cafeSlug}/${s.articleId}: ${s.reason}`);
    }
  }

  if (result.errors.length > 0) {
    console.log(`\n[SCAN] 에러 ${result.errors.length}건`);
    for (const e of result.errors) {
      console.log(`  ! ${e.cafeSlug}: ${e.error}`);
    }
  }
};

main()
  .catch((error) => {
    console.error('scan-low-comment-articles failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeAllContexts();
    await mongoose.disconnect();
  });
