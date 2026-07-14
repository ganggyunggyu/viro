/**
 * 네이버 카페 개설 CLI.
 *
 * 실제 로직은 src/shared/lib/naver-cafe-creation 에 있음 — 이 파일은
 * 계정/카페명 등 이번 실행에 쓸 값만 정의하고 그 모듈을 호출하는 얇은 러너다.
 * 다음에 다른 카페를 또 만들 땐 아래 상수만 바꿔서 재실행하면 됨.
 *
 * 사용법:
 *   npx tsx --env-file=.env.local scripts/create-naver-cafe.ts            # 드라이런 (폼만 채움, 제출 안 함)
 *   npx tsx --env-file=.env.local scripts/create-naver-cafe.ts --submit   # 실제 생성 + DB 등록 + 시트 동기화까지
 *
 * --submit 성공 시 DB(CafeConfig) 등록에 이어 "21lab 카페 운영 현황" 구글시트의
 * "카페정보 및 링크" / "카페계정정보" 탭까지 같이 갱신한다 (sheet-sync.ts).
 * 카페를 만들고 시트 기록을 빼먹는 일이 없도록 이 스크립트를 거치지 않고
 * createNaverCafe() 를 직접 호출하는 코드를 새로 짤 때도 반드시 syncCafeToOperationsSheet() 를 같이 불러줄 것.
 */
import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { User } from '../src/shared/models/user';
import {
  createNaverCafe,
  registerCreatedCafeInDb,
  type CreateCafeInput,
} from '../src/shared/lib/naver-cafe-creation';
import { syncCafeToOperationsSheet } from '../src/shared/lib/naver-cafe-creation/sheet-sync';

const ACCOUNT_ID = 'ahffkdlek12';
const LOGIN_ID = '21lab';
// "카페정보 및 링크" 시트의 카테고리 칸에 들어갈 짧은 표시용 라벨 (네이버 대분류값과 다를 수 있음)
const CAFE_SHEET_CATEGORY = '육아';

const CAFE_INPUT: CreateCafeInput = {
  name: '육아 돌봄수첩',
  slug: 'babycare702',
  categoryMajor: '가족/육아',
  categoryMinor: '가족/육아일반',
  description: '아이 키우며 알아두면 편한 정보와 소소한 육아 일상을 나누는 공간입니다.',
  keywords: ['육아', '육아정보', '돌봄', '아기용품', '초보맘'],
};

const SHOULD_SUBMIT = process.argv.includes('--submit');

const main = async () => {
  await connectDB();

  const account = await Account.findOne({ accountId: ACCOUNT_ID }).lean();
  if (!account) throw new Error('계정을 찾을 수 없음: ' + ACCOUNT_ID);

  const result = await createNaverCafe(ACCOUNT_ID, account.password, CAFE_INPUT, {
    dryRun: !SHOULD_SUBMIT,
  });
  console.log('[CREATE RESULT]', result);

  if (!result.success) {
    process.exit(1);
  }

  if (result.dryRun) {
    console.log('[DRY RUN] --submit 없이 실행됨. 실제 카페는 생성되지 않았음.');
    process.exit(0);
  }

  if (!result.cafeId || !result.cafeUrl) {
    console.warn('[경고] cafeId/cafeUrl을 못 읽어서 DB 등록은 건너뜀. 카페는 이미 생성됐을 수 있음 — 수동 확인 필요');
    process.exit(1);
  }

  const user = await User.findOne({ loginId: LOGIN_ID }).lean();
  if (!user) {
    console.warn('[경고] 로그인 유저를 못 찾아서 DB 등록은 건너뜀:', LOGIN_ID);
    process.exit(1);
  }

  await registerCreatedCafeInDb(
    user.userId,
    {
      cafeId: result.cafeId,
      cafeUrl: result.cafeUrl,
      name: result.name || CAFE_INPUT.name,
    },
    { ownerAccountId: ACCOUNT_ID },
  );
  console.log('[DB 등록 완료]', result.cafeUrl);

  const sheetSync = await syncCafeToOperationsSheet({
    category: CAFE_SHEET_CATEGORY,
    name: result.name || CAFE_INPUT.name,
    cafeId: result.cafeId,
    slug: CAFE_INPUT.slug,
    ownerAccountId: ACCOUNT_ID,
    ownerNickname: account.nickname || ACCOUNT_ID,
    memberCount: 1,
  });
  console.log('[시트 동기화]', sheetSync);

  process.exit(0);
};

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
