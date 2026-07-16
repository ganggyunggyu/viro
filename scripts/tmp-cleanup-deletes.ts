import mongoose from 'mongoose';
import { Account } from '../src/shared/models';
import { deleteCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-deleter';

const USER_ID = 'user-1768955529317';

interface DeleteTarget {
  label: string;
  cafeId: string;
  articleId: number;
  commentIds: string[];
}

const TARGETS: DeleteTarget[] = [
  { label: 'driveee/120 중복', cafeId: '31746635', articleId: 120, commentIds: ['76469660', '76469726', '76469818', '76469877'] },
  { label: 'motherrr/24 중복', cafeId: '31751094', articleId: 24, commentIds: ['89050634', '89050748'] },
  { label: 'driveee/127 중복', cafeId: '31746635', articleId: 127, commentIds: ['76469779', '76469886'] },
  { label: 'menunote702/30 구캠페인 잔여', cafeId: '31750111', articleId: 30, commentIds: ['64109141', '64109717'] },
  { label: 'mealtalkdht/26 구캠페인 잔여', cafeId: '31750099', articleId: 26, commentIds: ['130757217'] },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  const accounts = await Account.find({ userId: USER_ID, isActive: true })
    .select('accountId password nickname')
    .lean();

  for (const target of TARGETS) {
    console.log(`\n=== ${target.label} ===`);
    for (const commentId of target.commentIds) {
      let deleted = false;
      for (const acc of accounts) {
        const res = await deleteCommentWithAccount(
          { id: acc.accountId, password: acc.password, nickname: acc.nickname || acc.accountId },
          target.cafeId,
          target.articleId,
          commentId,
        );
        if (res.success) {
          console.log(`  ${commentId} 삭제 성공 (${acc.accountId})`);
          deleted = true;
          break;
        }
      }
      if (!deleted) console.log(`  ${commentId} 삭제 실패 - 작성 계정을 찾지 못함`);
    }
  }

  await mongoose.disconnect();
})();
