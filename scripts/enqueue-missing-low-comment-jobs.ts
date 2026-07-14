import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { readFileSync } from 'fs';
import mongoose from 'mongoose';
import { User, ManualCommentJob } from '../src/shared/models';
import { createManualCommentJobRecord } from '../src/features/manual-comment-job/actions';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const AUDIT = '/private/tmp/claude-501/-Users-ganggyunggyu-Programing-cafe-bot/c8649e88-3fb7-429b-aca4-8e14ef7eae90/scratchpad/low-comment-audit.json';
const APPLY = process.argv.includes('--apply');

interface Target { cafeId: string; cafeUrl: string; articleId: number; commentCount: number; subject: string; name: string }

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10_000 });
  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error('user not found');
  const userId = (user as any).userId;

  const audit = JSON.parse(readFileSync(AUDIT, 'utf-8'));
  const targets: Target[] = [];
  for (const rep of audit.reports as any[]) {
    for (const a of rep.lowComment || []) {
      targets.push({
        cafeId: rep.cafe.cafeId,
        cafeUrl: rep.cafe.cafeUrl,
        articleId: a.articleId,
        commentCount: a.commentCount,
        subject: a.subject,
        name: rep.cafe.name,
      });
    }
  }
  console.log(`감사 대상 글: ${targets.length}개`);

  // 현재 대기/진행 중 작업 키 (cafeId:articleId)
  const active = await ManualCommentJob.find(
    { userId, status: { $in: ['pending', 'running'] } },
    { cafeId: 1, articleId: 1 },
  ).lean<Array<{ cafeId: string; articleId: number }>>();
  const activeKeys = new Set(active.map((j) => `${j.cafeId}:${j.articleId}`));
  console.log(`현재 대기/진행 중 작업: ${active.length}개`);

  // 1) driveee/85 stale 작업 정리 (이미 5개 댓글 채운 글)
  const staleFilter = { userId, cafeId: '31746635', articleId: 85, status: { $in: ['pending', 'running'] } };
  const staleCount = await ManualCommentJob.countDocuments(staleFilter);
  console.log(`\ndriveee/85 stale 대기 작업: ${staleCount}개`);
  if (APPLY && staleCount > 0) {
    await ManualCommentJob.deleteMany(staleFilter);
    console.log('  → 삭제 완료');
  }

  // 2) 미등록 타겟 enqueue
  const missing = targets.filter((t) => !activeKeys.has(`${t.cafeId}:${t.articleId}`));
  console.log(`\n미등록(신규 큐 대상): ${missing.length}개`);
  const byCafe: Record<string, number[]> = {};
  for (const m of missing) (byCafe[m.name] ||= []).push(m.articleId);
  for (const [name, ids] of Object.entries(byCafe)) {
    console.log(`  ${name}: ${ids.length}개 [${ids.sort((a, b) => a - b).join(',')}]`);
  }

  if (!APPLY) {
    console.log('\n(--apply 없음: 미리보기만)');
    await mongoose.disconnect();
    return;
  }

  let queued = 0;
  const failed: string[] = [];
  for (const m of missing) {
    const articleUrl = `https://cafe.naver.com/${m.cafeUrl}/${m.articleId}`;
    const res = await createManualCommentJobRecord(
      userId,
      { articleUrl, cafeSlug: m.cafeUrl, cafeId: m.cafeId, articleId: m.articleId },
      { articleUrl, mode: 'generate', generateMinCount: 8, generateMaxCount: 13, delayMinMinutes: 3, delayMaxMinutes: 8 },
    );
    if (res.success) queued += 1;
    else failed.push(`${m.cafeUrl}/${m.articleId}: ${res.error}`);
  }
  console.log(`\n신규 등록 완료: ${queued}개`);
  if (failed.length) { console.log(`실패 ${failed.length}개:`); failed.forEach((f) => console.log(`  ! ${f}`)); }

  const after = await ManualCommentJob.aggregate([
    { $match: { userId } },
    { $group: { _id: '$status', n: { $sum: 1 } } },
  ]);
  console.log(`\n최종 상태별: ${JSON.stringify(after)}`);
  await mongoose.disconnect();
};

main().catch((e) => { console.error(e); process.exit(1); });
