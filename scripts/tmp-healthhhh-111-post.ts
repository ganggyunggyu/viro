import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import { Account } from '../src/shared/models/account';
import { ManualCommentJob } from '../src/shared/models/manual-comment-job';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { addCommentToArticle } from '../src/shared/models/published-article';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const MONGODB_URI = process.env.MONGODB_URI!;
const CAFE_ID = '31746910'; // healthhhh (기존 확인된 cafeId)
const ARTICLE_ID = 111;

// 동시에 돌고 있는 큐 잡(localtable702/62: k7d9x2m4 등) + driveee/108 직접실행 스크립트
// (vegetable10517, h9ag469z, laghunter8, eghfsa5478, ahsxkfldk12)와 전혀 겹치지 않는 계정만 사용
const JOBS: Array<{ accountId: string; content: string }> = [
  { accountId: 'mad1651', content: '출산선물세트 공유해주셔서 감사해요!' },
  { accountId: 'individual14144', content: '출산선물세트 뭐할지 고민중이였는데 좋은 정보  너무 좋네요' },
  { accountId: 'crvfwy7062', content: '확실히 출산 이후에는 몸건강을 챙기는게 제일 중요한 것 같아요' },
  { accountId: 'heavymouse448', content: '출산선물 고민중이긴했는데 기력회복으로 흑염소 드려봐야겠어용' },
  { accountId: 'weed3122', content: '이래저래 고민중이였는데 방향성이 좁혀진 것 같아요 좋은 정보 감사합니다!' },
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
    { cafeSlug: 'healthhhh', articleId: ARTICLE_ID, status: 'pending' },
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
