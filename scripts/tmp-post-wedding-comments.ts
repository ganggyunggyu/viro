import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import { getAccountById } from '../src/shared/config/accounts';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { isAccountLoggedIn, loginAccount } from '../src/shared/lib/multi-session';
import { Account } from '../src/shared/models/account';

const MONGODB_URI = process.env.MONGODB_URI!;

type Job = { cafeId: string; articleId: number; content: string; accountId: string; label: string };

const ASAN_COMMENTS = [
  '아산웨딩홀 알아보다가 봤는데 천장 오픈 연출이 진짜 예쁘네요. 직접 보면 더 특별할 것 같아요.',
  '신부대기실 분위기가 너무 제 스타일이에요. 아산웨딩홀 투어하면 꼭 둘러보고 싶은 곳이네요.',
  '리뉴얼되고 분위기가 훨씬 화사해진 것 같아요~ 상담 한번 받아보고 싶네요ㅎㅎ',
  '아산 쪽 웨딩홀 알아보고 있었는데 여기 처음 알았어요. 정보 감사합니다!',
  '사진으로만 봐도 공간이 넓어 보여서 답답한 느낌이 없네요~',
  '아산웨딩홀 투어 예정인데 비교 리스트에 넣어봐야겠어요',
  '아산지역으로 웨딩홀 알아보며 예식 준비 중이었는데 도움 많이 됐습니다.',
  '하객분들도 여행 온 듯한 기분으로 즐길 수 있을 것 같을것 같습니다',
];

const GWANGJU_COMMENTS = [
  '새롭게 리뉴얼됐다고 해서 사진 찾아봤는데 전체적인 분위기가 정말 고급스러워졌더라고요. 광주예식장 알아보는 분들이 많이 찾는 이유를 알 것 같아요.',
  '저도 광주에서 예식장 찾아보다가 드메르웨딩홀 상담 다녀왔는데 전보다 홀이 훨씬 세련된 느낌이라 마음에 들었어요. 실제로 보면 더 예쁘다는 이야기가 많더라고요.',
  '드메르웨딩홀은 예전에도 예쁜 곳이라고 생각했는데 리뉴얼되고 나니까 분위기가 한층 더 좋아진 것 같아요. 신부대기실도 정말 예쁘게 바뀌었더라고요.',
  '광주예식장 투어하면서 둘러봤는데 홀이 전체적으로 깔끔하고 고급스러운 느낌이었어요. 리뉴얼된 부분이 확실히 눈에 들어오더라고요.',
  '지인 결혼식으로 다녀온 적 있는데 식사도 만족스러웠고 홀도 예뻤어요.',
  '더 화사하고 세련된 느낌으로 바뀐 것 같고 예식하기 딱 좋아 보여요. 어느 홀에서 해야 되나 너무 고민될 수 밖에 없겠는데요 ㅠㅠㅠ',
  '광주에서 예식장 알아보는 중인데 드메르웨딩홀도 후보에 넣었어요. 리뉴얼된 홀이 너무 예뻐서 직접 상담받아보고 싶어졌네요.',
  '새롭게 바뀌면서 인테리어가 훨씬 고급스러워진 것 같아요. 예식 사진도 정말 예쁘게 나올 것 같아서 기대됩니다.',
];

const ILSAN_COMMENTS = [
  '천년컨벤션 일산웨딩홀에서 가성비 좋기로 유명한 곳이잖아요 잘 보고 오신것 같아요.',
  '사진으로 봐도 예쁘지만 실제로 방문해서 보면 더 예쁜곳이에요.',
  '일산 웨투 준비중인데 웨딩홀 둘러볼때 참고해야 할것 같네요 감사합니다.',
  '분위기도 좋고 플라워 장식들이 참 예쁜 곳이네요',
  '직접 하객으로 가본적이 있었는데 위치도좋고 홀분위기도 참 좋았던 곳으로 기억납니다. 물론 식사도 좋았어요',
];

const PRIMARY_ACCOUNTS = {
  asan: ['ahfflwl123', 'dq1h3bjy', 'ahsxkfldk12', 'eghfsa5478', 'geenl', 'produce11745', 'ghostrush7', 'k7d9x2m4'],
  gwangju: ['laghunter8', 'alsrudgus531', 'n7c3w8z2', 'h9ag469z', 'vegetable10517', 'akepzkthf12', 'ggg8019', 'rqr1io45'],
  ilsan: ['weed3122', 'mad1651', 'individual14144', 'crvfwy7062', 'heavymouse448'],
};

const BACKUP_QUEUE = ['compare14310', 'regular14631', 'fail5644', 'angrykoala270', 'tinyfish183', 'nes1p2kx', 'mh8j62wm', 'hagyga', 'ahffkekd12', 'respawnking9'];

const jobs: Job[] = [
  ...ASAN_COMMENTS.map((content, i) => ({ cafeId: '31750113', articleId: 8, content, accountId: PRIMARY_ACCOUNTS.asan[i], label: '아산' })),
  ...GWANGJU_COMMENTS.map((content, i) => ({ cafeId: '31750110', articleId: 6, content, accountId: PRIMARY_ACCOUNTS.gwangju[i], label: '광주' })),
  ...ILSAN_COMMENTS.map((content, i) => ({ cafeId: '31750110', articleId: 3, content, accountId: PRIMARY_ACCOUNTS.ilsan[i], label: '일산' })),
];

const results: Array<{ accountId: string; label: string; success: boolean; commentId?: string; error?: string }> = [];

const tryLogin = async (accountId: string, password: string): Promise<boolean> => {
  const loggedIn = await isAccountLoggedIn(accountId);
  if (loggedIn) return true;
  for (let i = 0; i < 3; i++) {
    const r = await loginAccount(accountId, password);
    if (r.success) return true;
    console.log(`[LOGIN RETRY ${i + 1}] ${accountId} 실패: ${r.error}`);
  }
  return false;
};

const main = async (): Promise<void> => {
  await mongoose.connect(MONGODB_URI);
  const backups = [...BACKUP_QUEUE];

  for (const job of jobs) {
    let accountId = job.accountId;
    let attemptsLeft = 3;
    let success = false;
    let lastError = '';
    let commentId: string | undefined;

    while (attemptsLeft > 0 && !success) {
      attemptsLeft--;
      const dbAcc = await Account.findOne({ accountId }).lean();
      if (!dbAcc) {
        lastError = '계정 없음';
        accountId = backups.shift() || accountId;
        continue;
      }

      const loginOk = await tryLogin(accountId, dbAcc.password);
      if (!loginOk) {
        lastError = '로그인 실패';
        console.log(`[SWITCH] ${job.label} - ${accountId} 로그인 실패, 다음 계정으로 교체`);
        const next = backups.shift();
        if (!next) break;
        accountId = next;
        continue;
      }

      const account = await getAccountById(accountId);
      if (!account) {
        lastError = 'NaverAccount 매핑 실패';
        break;
      }

      const r = await writeCommentWithAccount(account, job.cafeId, job.articleId, job.content, { loginWaitMs: 5000 });
      if (r.success) {
        success = true;
        commentId = r.commentId;
      } else {
        lastError = r.error || '알 수 없는 오류';
        console.log(`[SWITCH] ${job.label} - ${accountId} 댓글 작성 실패(${lastError}), 다음 계정으로 교체`);
        const next = backups.shift();
        if (!next) break;
        accountId = next;
      }
    }

    console.log(`[${success ? 'OK' : 'FAIL'}] ${job.label} / ${accountId} / "${job.content.slice(0, 20)}..."${success ? '' : ' - ' + lastError}`);
    results.push({ accountId, label: job.label, success, commentId, error: success ? undefined : lastError });
  }

  console.log('\n=== 최종 결과 ===');
  console.log(JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.success);
  console.log(`\n성공: ${results.length - failed.length}/${results.length}, 실패: ${failed.length}`);

  await mongoose.disconnect();
};

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
