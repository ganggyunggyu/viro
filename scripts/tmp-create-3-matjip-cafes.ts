import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { User } from '../src/shared/models/user';
import {
  createNaverCafe,
  registerCreatedCafeInDb,
  type CreateCafeInput,
} from '../src/shared/lib/naver-cafe-creation';
import { syncCafeToOperationsSheet } from '../src/shared/lib/naver-cafe-creation/sheet-sync';

const LOGIN_ID = '21lab';
const CAFE_SHEET_CATEGORY = '맛집';
const SHOULD_SUBMIT = process.argv.includes('--submit');

interface CafePlan {
  accountId: string;
  input: CreateCafeInput;
}

const PLANS: CafePlan[] = [
  {
    accountId: 'angrykoala270',
    input: {
      name: '맛집 미식노트',
      slug: 'gourmetnote702',
      categoryMajor: '생활',
      categoryMinor: '맛집',
      description: '여기저기 다녀본 맛집과 메뉴 후기를 편하게 기록하고 나누는 공간입니다.',
      keywords: ['맛집', '맛집추천', '맛집후기', '맛집리스트', '맛집정보'],
    },
  },
  {
    accountId: 'geenl',
    input: {
      name: '맛집 한끼일기',
      slug: 'mealdiary702',
      categoryMajor: '생활',
      categoryMinor: '맛집',
      description: '오늘 뭐 먹었는지, 어디가 맛있었는지 한 끼씩 기록하는 맛집 일기장입니다.',
      keywords: ['맛집', '맛집일기', '맛집기록', '오늘뭐먹지', '맛집추천'],
    },
  },
  {
    accountId: 'cothdals1001',
    input: {
      name: '맛집 맛기행',
      slug: 'tastetrip702',
      categoryMajor: '생활',
      categoryMinor: '맛집',
      description: '동네부터 여행지까지, 직접 다녀본 맛집을 소개하고 정보를 나누는 공간입니다.',
      keywords: ['맛집', '맛집여행', '맛집탐방', '맛집추천', '맛집리스트'],
    },
  },
];

const main = async () => {
  await connectDB();
  const user = await User.findOne({ loginId: LOGIN_ID }).lean();
  if (!user) throw new Error('로그인 유저를 못 찾음: ' + LOGIN_ID);

  for (const plan of PLANS) {
    console.log(`\n===== ${plan.input.name} (${plan.accountId}) =====`);
    const account = await Account.findOne({ accountId: plan.accountId }).lean();
    if (!account) {
      console.warn('계정을 찾을 수 없음:', plan.accountId);
      continue;
    }

    const result = await createNaverCafe(plan.accountId, account.password, plan.input, {
      dryRun: !SHOULD_SUBMIT,
    });
    console.log('[CREATE RESULT]', result);

    if (!result.success) {
      console.warn('실패, 다음으로 넘어감');
      continue;
    }

    if (result.dryRun) {
      console.log('[DRY RUN] --submit 없이 실행됨. 실제 카페는 생성되지 않았음.');
      continue;
    }

    if (!result.cafeId || !result.cafeUrl) {
      console.warn('[경고] cafeId/cafeUrl을 못 읽어서 DB 등록은 건너뜀. 카페는 이미 생성됐을 수 있음 — 수동 확인 필요');
      continue;
    }

    await registerCreatedCafeInDb(
      user.userId,
      {
        cafeId: result.cafeId,
        cafeUrl: result.cafeUrl,
        name: result.name || plan.input.name,
      },
      { ownerAccountId: plan.accountId },
    );
    console.log('[DB 등록 완료]', result.cafeUrl);

    const sheetSync = await syncCafeToOperationsSheet({
      category: CAFE_SHEET_CATEGORY,
      name: result.name || plan.input.name,
      cafeId: result.cafeId,
      slug: plan.input.slug,
      ownerAccountId: plan.accountId,
      ownerNickname: account.nickname || plan.accountId,
      memberCount: 1,
    });
    console.log('[시트 동기화]', sheetSync);
  }

  process.exit(0);
};

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
