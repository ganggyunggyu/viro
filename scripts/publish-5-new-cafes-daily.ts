/**
 * 신규카페 5곳(육아 돌봄수첩/건강 체크노트/건강 정보노트/생활 살림노트/일상 소소담) 전용 —
 * 카페당 테테 원고 5편씩(이미지 3장) 발행. 매일 오전 9시 스케줄 태스크에서 호출됨.
 *
 * 카페마다 주인 계정이 달라 락 충돌이 없으므로 5개 카페를 병렬로 돌리고,
 * 같은 카페 안에서는(같은 계정 반복 사용) 네이버 실시간 발행 간격을 10분 두어
 * 계정 하나가 짧은 시간에 여러 번 글을 쓰지 않게 한다(네이버 자체 예약발행 필드가 없음).
 *
 * 사용법:
 *   npx tsx --env-file=.env.local scripts/publish-5-new-cafes-daily.ts
 */
import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { User } from '../src/shared/models/user';
import { generateTeteContent, generateImages, downloadImageAsBase64 } from '../src/shared/api/content-api';
import { writePostWithAccount } from '../src/shared/lib/naver-cafe-writing';
import type { NaverAccount } from '../src/shared/lib/account-manager';

const LOGIN_ID = '21lab';
const IMAGE_COUNT = 3;
const POSTS_PER_CAFE = 5;
const INTERVAL_MS = 10 * 60 * 1000; // 10분

const CAFE_IDS = [
  '31754837', // 육아 돌봄수첩
  '31754869', // 건강 체크노트
  '31754875', // 건강 정보노트
  '31754939', // 생활 살림노트
  '31755069', // 일상 소소담
];

const KEYWORD_POOL = [
  '접이식카트', '손가락 관절통증', '손가락 마디통증', '나비약', '베르베린 효능', '위고비 후기',
  '드라이기', '헤어드라이기', '드라이기 추천', '선풍기', '인천웨딩홀', '날개없는 선풍기',
  '랩다이아가격', '다이아몬드시세', '다이아시세', '다이아몬드1캐럿가격', '다이아1캐럿가격',
  '효성쥬얼리시티', '종로효성주얼리시티', '강아지 눈 영양제', '강아지 영양제', '강아지 관절 영양제',
  '먹는 위고비', '베르가못', '마운자로 요요', '무지외반증 교정기', '족저근막염깔창', '올리브오일',
  '조문 답례품', '밀크씨슬', '아치깔창', '족저근막염 신발', '푸룬주스', '장에좋은음식', '답례품',
  '종로웨딩밴드', '종로반지', '종로금은방', '회사 답례품', '결혼 답례품', '삼척카페', '부평웨딩홀',
  '알파cd', '대구사진관', '천안내성발톱', '천안웨딩홀', '수원웨딩홀', '인천예식장', '광주웨딩홀',
  '부천웨딩홀', '아산카페', '의정부웨딩홀', '인천웨딩홀추천', '음식물처리기', '음식물분쇄기',
  '미용실드라이기', '종로다이아몬드', '종로결혼반지', '종로웨딩반지', '웨딩반지브랜드', '30대커플링',
  '종로예물반지', '백금반지', '다이아몬드반지', '18K결혼반지', '명품결혼반지', '18K커플링',
  '커플링브랜드', '웨딩링추천', '14K커플링', '명품반지브랜드', '종로예물', '백금커플링', '웨딩반지',
  '예물', '예물반지', '결혼예물', '랩다이아', '랩그라운다이아', '랩다이아귀걸이', '랩다이아몬드반지',
  '랩다이아목걸이', '웨딩링브랜드', '웨딩밴드브랜드', '결혼반지브랜드', '커플반지', '명품커플링',
  '프로포즈링', '랩다이아가드링', '다이아몬드가격',
];

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const parseManuscript = (raw: string): { subject: string; content: string } => {
  const lines = raw.split('\n');
  const subject = lines[0]?.trim() || '';
  const content = lines.slice(1).join('\n').trim();
  return { subject, content };
};

const publishOneCafe = async (
  cafeId: string,
  keywords: string[],
  userId: string,
): Promise<{ cafeId: string; success: number; fail: number }> => {
  const cafe = await Cafe.findOne({ userId, cafeId }).lean();
  if (!cafe) {
    console.error(`[${cafeId}] 카페 못찾음`);
    return { cafeId, success: 0, fail: keywords.length };
  }
  if (!cafe.ownerAccountId) {
    console.error(`[${cafe.name}] 주인 계정 정보 없음`);
    return { cafeId, success: 0, fail: keywords.length };
  }
  const accountDoc = await Account.findOne({ accountId: cafe.ownerAccountId }).lean();
  if (!accountDoc) {
    console.error(`[${cafe.name}] 주인 계정 문서 없음: ${cafe.ownerAccountId}`);
    return { cafeId, success: 0, fail: keywords.length };
  }

  let success = 0;
  let fail = 0;

  for (let i = 0; i < keywords.length; i += 1) {
    const keyword = keywords[i];
    console.log(`\n===== [${cafe.name}] [${i + 1}/${keywords.length}] "${keyword}" =====`);

    try {
      const manuscript = await generateTeteContent({ keyword });
      const { subject, content } = parseManuscript(manuscript.content);
      console.log(`[${cafe.name}][원고] 유형=${manuscript.contentType} 제목="${subject}"`);

      const imageResult = await generateImages({ keyword, category: manuscript.category, count: IMAGE_COUNT });
      const imageUrls = imageResult.images || [];

      const base64Images: string[] = [];
      for (const url of imageUrls) {
        const b64 = await downloadImageAsBase64(url);
        if (b64) base64Images.push(b64);
      }
      console.log(`[${cafe.name}][이미지] ${base64Images.length}장 준비`);

      const naverAccount: NaverAccount = {
        id: accountDoc.accountId,
        password: accountDoc.password,
        nickname: accountDoc.nickname,
      };

      const postResult = await writePostWithAccount(naverAccount, {
        cafeId: cafe.cafeId,
        menuId: cafe.menuId,
        subject,
        content,
        category: cafe.categories?.[0],
        images: base64Images,
      });

      if (postResult.success) {
        console.log(`[${cafe.name}][발행 성공] articleId=${postResult.articleId ?? '?'}`);
        success += 1;
      } else {
        console.error(`[${cafe.name}][발행 실패] ${postResult.error}`);
        fail += 1;
      }
    } catch (error) {
      console.error(`[${cafe.name}] !!! 에러:`, error instanceof Error ? error.message : error);
      fail += 1;
    }

    if (i < keywords.length - 1) {
      console.log(`[${cafe.name}] 다음 글까지 10분 대기...`);
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }
  }

  return { cafeId, success, fail };
};

const main = async () => {
  await connectDB();
  const user = await User.findOne({ loginId: LOGIN_ID }).lean();
  if (!user) throw new Error('21lab user not found');

  const shuffledKeywords = shuffle(KEYWORD_POOL);
  const needed = CAFE_IDS.length * POSTS_PER_CAFE;
  const picked = shuffledKeywords.slice(0, needed);

  const cafeKeywordMap = CAFE_IDS.map((cafeId, idx) => ({
    cafeId,
    keywords: picked.slice(idx * POSTS_PER_CAFE, (idx + 1) * POSTS_PER_CAFE),
  }));

  console.log(`대상 카페 ${CAFE_IDS.length}곳, 카페당 ${POSTS_PER_CAFE}편, 총 ${needed}편 발행 시작`);
  cafeKeywordMap.forEach(({ cafeId, keywords }) => console.log(` - ${cafeId}: ${keywords.join(', ')}`));

  const results = await Promise.all(
    cafeKeywordMap.map(({ cafeId, keywords }) => publishOneCafe(cafeId, keywords, user.userId)),
  );

  const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
  const totalFail = results.reduce((sum, r) => sum + r.fail, 0);
  console.log(`\n===== 전체 완료: 성공 ${totalSuccess} / 실패 ${totalFail} / 총 ${needed} =====`);
  results.forEach((r) => console.log(` - ${r.cafeId}: 성공 ${r.success} / 실패 ${r.fail}`));

  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
