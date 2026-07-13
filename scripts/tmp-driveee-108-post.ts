import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import { Account } from '../src/shared/models/account';
import { ManualCommentJob } from '../src/shared/models/manual-comment-job';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { addCommentToArticle } from '../src/shared/models/published-article';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const MONGODB_URI = process.env.MONGODB_URI!;
const CAFE_ID = '31746635'; // driveee
const ARTICLE_ID = 108;

// 현재 큐 잡(localtable702/62)이 활발히 쓰고 있는 계정(ahffkdlek12, ahfflwl123, bigfish773, alsrudgus531)과
// 절대 겹치지 않는 계정만 선택
const JOBS: Array<{ accountId: string; content: string }> = [
  { accountId: 'vegetable10517', content: '산모출산선물 공유해주셔서 감사해요!' },
  { accountId: 'h9ag469z', content: '산모출산선물 좋은 정보  너무 좋네요' },
  { accountId: 'laghunter8', content: '산모출산선물 뭐가 좋을끼요' },
  { accountId: 'eghfsa5478', content: '산모출산선물 고민중이긴했는데 여름기력회복으로 흑염소 드려봐야겠어용' },
  { accountId: 'ahsxkfldk12', content: '이래저래 고민중이였는데 방향성이 좁혀진 것 같아요 좋은 정보 감사합니다!' },
];

const results: Array<{ accountId: string; content: string; success: boolean; error?: string; commentId?: string }> = [];

const main = async () => {
  await mongoose.connect(MONGODB_URI);

  for (const job of JOBS) {
    const acc = await Account.findOne({ accountId: job.accountId }).lean();
    if (!acc) {
      results.push({ ...job, success: false, error: '계정 없음' });
      continue;
    }

    const r = await writeCommentWithAccount(
      { id: acc.accountId, password: acc.password, nickname: acc.nickname },
      CAFE_ID,
      ARTICLE_ID,
      job.content,
    );

    console.log(`[${r.success ? 'OK' : 'FAIL'}] ${job.accountId}${r.error ? ' - ' + r.error : ''}`);
    results.push({ ...job, success: r.success, error: r.error, commentId: r.commentId });

    if (r.success) {
      await addCommentToArticle(CAFE_ID, ARTICLE_ID, {
        accountId: acc.accountId,
        nickname: acc.nickname || acc.accountId,
        content: job.content,
        type: 'comment',
        commentId: r.commentId,
      });
    }
  }

  console.log('\n=== 결과 ===');
  console.log(JSON.stringify(results, null, 2));
  const successCount = results.filter((r) => r.success).length;
  console.log(`성공: ${successCount}/${results.length}`);

  await ManualCommentJob.updateOne(
    { cafeSlug: 'driveee', articleId: ARTICLE_ID, status: 'pending' },
    {
      $set: {
        status: successCount > 0 ? 'done' : 'failed',
        errorMessage: successCount === 0 ? '모든 계정 시도 실패' : '큐 우회 직접 실행으로 완료됨',
        results: results.map((r, i) => ({
          index: i,
          accountId: r.accountId,
          content: r.content,
          success: r.success,
          error: r.error,
          commentId: r.commentId,
          postedAt: new Date(),
        })),
      },
    },
  );

  await closeAllContexts();
  await mongoose.disconnect();
};

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
