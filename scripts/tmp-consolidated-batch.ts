import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import { Account } from '../src/shared/models/account';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { addCommentToArticle } from '../src/shared/models/published-article';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const MONGODB_URI = process.env.MONGODB_URI!;

// 검증된 핵심 계정만 사용 (여분 계정군은 신규 글에서 거의 다 막히는 패턴 확인됨)
const CORE_POOL = [
  'k7d9x2m4', 'n7c3w8z2', 'produce11745', 'geenl', 'ghostrush7',
  'vegetable10517', 'h9ag469z', 'laghunter8', 'eghfsa5478', 'ahsxkfldk12',
  'bigfish773', 'alsrudgus531', 'pixelninja3', 'q9v3m7a2', 'ahffkdlek12',
  'k7d9x2m4', 'n7c3w8z2', 'produce11745', 'geenl',
];
let poolIdx = 0;
const nextAccount = () => CORE_POOL[poolIdx++ % CORE_POOL.length];

const HEALTHHHH = '31746910';
const DRIVEEE = '31746635';

const TASKS: Array<{ label: string; cafeId: string; articleId: number; content: string }> = [
  // healthhhh/114 재시도 2건
  { label: 'healthhhh/114 재시도', cafeId: HEALTHHHH, articleId: 114, content: '선물 추천리스트 이런 정보 넘 좋다,' },
  { label: 'healthhhh/114 재시도', cafeId: HEALTHHHH, articleId: 114, content: '엄마생신선물 고민할 것 없이 여름회복을 위해 흑염소로 가봐야겠어요' },
  // healthhhh/116 1차 배치 전체 재시도 5건
  { label: 'healthhhh/116 1차 재시도', cafeId: HEALTHHHH, articleId: 116, content: '흑염소진액의 경우 몸이 찬사람에게 더 좋을까요?' },
  { label: 'healthhhh/116 1차 재시도', cafeId: HEALTHHHH, articleId: 116, content: '최근출산한 아내에게 고민할 것 없이 여름기력회복을 위해 흑염소로 가봐야겠어요' },
  { label: 'healthhhh/116 1차 재시도', cafeId: HEALTHHHH, articleId: 116, content: '아내랑 저랑 같이 먹어봐도 좋을 것 같네요' },
  { label: 'healthhhh/116 1차 재시도', cafeId: HEALTHHHH, articleId: 116, content: '방향성이 잡힌 것 같네요 ㅎㅎ' },
  { label: 'healthhhh/116 1차 재시도', cafeId: HEALTHHHH, articleId: 116, content: '선물 추천리스트 이런 정보 넘 좋다,' },
  // driveee/116 재시도 2건
  { label: 'driveee/116 재시도', cafeId: DRIVEEE, articleId: 116, content: '올여름을 기력회복을 위해 어머님께 흑염소 드려봐야겠어용' },
  { label: 'driveee/116 재시도', cafeId: DRIVEEE, articleId: 116, content: '이래저래 고민중이였는데 방향성이 좁혀진 것 같아요 좋은 정보 감사합니다!' },
  // driveee/117 신규 5건
  { label: 'driveee/117 신규', cafeId: DRIVEEE, articleId: 117, content: '흑염소는 몸이 찬사람에게 더 좋을까요?' },
  { label: 'driveee/117 신규', cafeId: DRIVEEE, articleId: 117, content: '우리 둘째 출산한 아내에게 딱이다!' },
  { label: 'driveee/117 신규', cafeId: DRIVEEE, articleId: 117, content: '아내랑 저랑 같이 먹어봐도 좋을 것 같네요 ㅎㅎ' },
  { label: 'driveee/117 신규', cafeId: DRIVEEE, articleId: 117, content: '아내에게 이번에 점수 한번 따봅니다!' },
  { label: 'driveee/117 신규', cafeId: DRIVEEE, articleId: 117, content: '선물 추천리스트 이런 정보 넘 좋다,' },
  // healthhhh/116 2차 배치 신규 5건
  { label: 'healthhhh/116 2차 신규', cafeId: HEALTHHHH, articleId: 116, content: '선물 추천 리스트 공유해주셔서 감사해요!' },
  { label: 'healthhhh/116 2차 신규', cafeId: HEALTHHHH, articleId: 116, content: '아내생일선물 뭐할지 고민중이였는데 좋은 정보  너무 좋네요' },
  { label: 'healthhhh/116 2차 신규', cafeId: HEALTHHHH, articleId: 116, content: '아내가 건강을 많이 생각해서 뭘 드려야할지.. 흑염소진액 제품 추천 좀 받아볼 수 있을까요?' },
  { label: 'healthhhh/116 2차 신규', cafeId: HEALTHHHH, articleId: 116, content: '올여름을 기력회복을 위해 아내랑 저 둘다 흑염소 먹어봐야겠어요' },
  { label: 'healthhhh/116 2차 신규', cafeId: HEALTHHHH, articleId: 116, content: '이래저래 고민중이였는데 방향성이 좁혀진 것 같아요 좋은 정보 감사합니다!' },
];

const results: Array<{ label: string; cafeId: string; articleId: number; accountId: string; content: string; success: boolean; error?: string }> = [];

const main = async () => {
  await mongoose.connect(MONGODB_URI);

  for (const task of TASKS) {
    let success = false;
    let lastError = '';
    let usedAccount = '';

    for (let attempt = 0; attempt < 2 && !success; attempt++) {
      const accountId = nextAccount();
      usedAccount = accountId;
      const acc = await Account.findOne({ accountId }).lean();
      if (!acc) { lastError = '계정 없음'; continue; }

      const r = await writeCommentWithAccount(
        { id: acc.accountId, password: acc.password, nickname: acc.nickname },
        task.cafeId, task.articleId, task.content,
      );
      console.log(`[${r.success ? 'OK' : 'FAIL'}] ${task.label} / ${accountId}${r.error ? ' - ' + r.error : ''}`);
      if (r.success) {
        success = true;
        await addCommentToArticle(task.cafeId, task.articleId, {
          accountId: acc.accountId, nickname: acc.nickname || acc.accountId,
          content: task.content, type: 'comment', commentId: r.commentId,
        });
      } else {
        lastError = r.error || '알 수 없는 오류';
      }
    }

    results.push({ label: task.label, cafeId: task.cafeId, articleId: task.articleId, accountId: usedAccount, content: task.content, success, error: success ? undefined : lastError });
  }

  console.log('\n=== 최종 결과 ===');
  console.log(JSON.stringify(results, null, 2));
  const byLabel: Record<string, { ok: number; total: number }> = {};
  for (const r of results) {
    byLabel[r.label] = byLabel[r.label] || { ok: 0, total: 0 };
    byLabel[r.label].total += 1;
    if (r.success) byLabel[r.label].ok += 1;
  }
  console.log('\n=== 라벨별 집계 ===');
  console.log(JSON.stringify(byLabel, null, 2));

  await closeAllContexts();
  await mongoose.disconnect();
};

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
