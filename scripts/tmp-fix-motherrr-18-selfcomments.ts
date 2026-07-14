import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import { Account } from '../src/shared/models/account';
import { deleteCommentWithAccount, listLiveComments } from '../src/shared/lib/naver-cafe-writing/comment-deleter';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { removeCommentFromArticle, addCommentToArticle } from '../src/shared/models/published-article';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const MONGODB_URI = process.env.MONGODB_URI!;
const CAFE_ID = '31751094'; // motherrr
const ARTICLE_ID = 18;
const AUTHOR_ACCOUNT = 'produce11745'; // 글쓴이(가중건다) 본인
const VERIFIER = 'vegetable10517'; // 이미 가입된 다른 계정으로 라이브 재확인

const SELF_COMMENTS = [
  { commentId: '89033331', content: '아내가 40대인데 올해 기력도 딸리는 것 같아서 흑염소 선물을 하려했는데 마침 좋은 정보네요' },
  { commentId: '89033360', content: '저희 집이 본질을 중요하게 생각해서 건강이 인생의 전부라고 생각하는데.. 흑염소진액 제품 링크 좀 받아볼 수 있을까요?' },
];

// 이미 motherrr 가입 확인된 계정 중 이 글에서 아직 안 쓴 계정으로 교체
const REPLACEMENT_ACCOUNTS = ['h9ag469z', 'ahsxkfldk12'];

const getAccountObj = async (accountId: string) => {
  const acc = await Account.findOne({ accountId }).lean();
  if (!acc) throw new Error(`계정 없음: ${accountId}`);
  return { id: acc.accountId, password: acc.password, nickname: acc.nickname };
};

const main = async () => {
  await mongoose.connect(MONGODB_URI);

  const authorAccount = await getAccountObj(AUTHOR_ACCOUNT);
  const verifierAccount = await getAccountObj(VERIFIER);

  for (let i = 0; i < SELF_COMMENTS.length; i++) {
    const target = SELF_COMMENTS[i];
    console.log(`\n=== [${i + 1}/2] 삭제 대상: commentId=${target.commentId} ===`);

    const delResult = await deleteCommentWithAccount(authorAccount, CAFE_ID, ARTICLE_ID, target.commentId);
    console.log('삭제 결과:', JSON.stringify(delResult));

    if (!delResult.success) {
      console.log('삭제 실패 - 이 항목 스킵, 다음으로 진행');
      continue;
    }

    // 다른 계정으로 라이브 재확인: 해당 댓글만 사라졌는지 + 글 자체 살아있는지
    const check = await listLiveComments(verifierAccount, CAFE_ID, ARTICLE_ID);
    console.log('삭제 직후 라이브 재확인 (다른 계정):', JSON.stringify(check));
    const stillThere = check.comments?.some((c) => c.commentId === target.commentId);
    console.log(`  -> 해당 댓글 여전히 존재: ${stillThere} (false여야 정상)`);
    console.log(`  -> 현재 라이브 댓글 수: ${check.comments?.length}`);

    if (stillThere) {
      console.log('경고: 삭제됐다고 했는데 다른 계정 확인에서는 여전히 보임 - 조사 필요, 중단');
      break;
    }

    await removeCommentFromArticle(CAFE_ID, ARTICLE_ID, target.commentId);
    console.log('DB 동기화 완료');

    // 교체 댓글 게시
    const replacementAccountId = REPLACEMENT_ACCOUNTS[i];
    const replacementAccount = await getAccountObj(replacementAccountId);
    const postResult = await writeCommentWithAccount(replacementAccount, CAFE_ID, ARTICLE_ID, target.content);
    console.log(`교체 게시 결과 (${replacementAccountId}):`, JSON.stringify(postResult));

    if (postResult.success) {
      await addCommentToArticle(CAFE_ID, ARTICLE_ID, {
        accountId: replacementAccountId,
        nickname: replacementAccount.nickname || replacementAccountId,
        content: target.content,
        type: 'comment',
        commentId: postResult.commentId,
      });
      console.log('DB 반영 완료');
    }
  }

  console.log('\n=== 최종 라이브 상태 재확인 (다른 계정) ===');
  const final = await listLiveComments(verifierAccount, CAFE_ID, ARTICLE_ID);
  console.log(JSON.stringify(final, null, 2));
  console.log(`최종 댓글 수: ${final.comments?.length} (5여야 정상, 글쓴이 계정 댓글 0개여야 정상)`);
  const authorStillCommenting = final.comments?.some((c) => c.nickname === '가중건다');
  console.log(`글쓴이(가중건다) 댓글 잔존 여부: ${authorStillCommenting} (false여야 정상)`);

  await closeAllContexts();
  await mongoose.disconnect();
};

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
