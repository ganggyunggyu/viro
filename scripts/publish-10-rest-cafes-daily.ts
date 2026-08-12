/**
 * 나머지 10개 카페 전용 — 카페당 테테 원고 3편씩(이미지 3장) 발행.
 *
 * 맛집 3곳(publish-3-matjip-cafes-daily.ts), 신규 5곳(publish-5-new-cafes-daily.ts)에
 * 포함되지 않아 발행이 멈춰 있던 카페들이다. 실제 카페의 기존 글을 확인해보니
 * 카페 이름과 무관하게 전부 같은 범용 생활정보 키워드로 운영돼 왔으므로
 * (애견 카페에도 웨딩홀·올리브오일 글이 올라가 있다) 키워드 풀을 하나로 쓴다.
 *
 * ⚠️ 계정 하나가 두 카페를 맡는 경우가 있다(tinyfish183, k7d9x2m4).
 * 카페를 전부 병렬로 돌리면 그 계정이 짧은 시간에 6편을 쓰게 되므로,
 * 같은 계정이 맡은 카페들은 한 묶음으로 만들어 순차 실행한다.
 *
 * 사용법:
 *   npx tsx --env-file=.env.local scripts/publish-10-rest-cafes-daily.ts
 */
import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { User } from '../src/shared/models/user';
import {
  generateTeteContent,
  generateImages,
  downloadImageAsBase64,
} from '../src/shared/api/content-api';
import { writePostWithAccount } from '../src/shared/lib/naver-cafe-writing';
import type { NaverAccount } from '../src/shared/lib/account-manager';

const LOGIN_ID = '21lab';
const IMAGE_COUNT = 3;
const POSTS_PER_CAFE = 3;
const INTERVAL_MS = 10 * 60 * 1000; // 같은 계정이 연속으로 쓰지 않도록 10분

const CAFE_IDS = [
  '31750098', // 애견 반려정보    (tinyfish183)
  '31750100', // 애견 산책이야기  (k7d9x2m4)
  '31750104', // 일상 소통마당    (ahfflwl123)
  '31750105', // 건강 습관노트    (compare14310)
  '31750106', // 건강 생활수첩    (fail5644)
  '31750108', // 생활 정보마당    (ghostrush7)
  '31756088', // 오늘부터우리     (ahffkdlek12)
  '31756619', // 짱구짱아1        (orangeswan630)
  '31756734', // 뚜벅뚜벅1        (tinyfish183)
  '31756738', // 푸른물결우산     (k7d9x2m4)
];

// publish-5-new-cafes-daily.ts와 같은 풀. 실제 이 카페들에 올라가 있던 글들이 이 결이다.
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
  '프로포즈링', '랩다이아가드링', '다이아몬드가격', '룸스프레이', '섬유탈취제', '고체탈취제',
  '두유제조기', '신발깔창', '가습기', '제습기', '전기포트', '무선청소기',
  // 실제 이 카페들에 올라가 있던 주제 중 위 풀에 없던 것들
  '에어컨청소업체', '시스템에어컨청소업체', '방역업체', '청소업체추천', '무지외반증',
  '울산마운자로처방', '대구 가족사진', '평발 깔창', '요족 깔창',
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
  const subject = (lines[0]?.trim() || '').replace(/^\[?제목\]?[:\s]*/, '').trim();
  const content = lines.slice(1).join('\n').trim();
  return { subject, content };
};

interface CafeJob {
  cafeId: string;
  keywords: string[];
}

const publishOneCafe = async (
  { cafeId, keywords }: CafeJob,
  userId: string,
): Promise<{ cafeId: string; name: string; success: number; fail: number }> => {
  const cafe = await Cafe.findOne({ userId, cafeId }).lean();
  if (!cafe) {
    console.error(`[${cafeId}] 카페 못찾음`);
    return { cafeId, name: cafeId, success: 0, fail: keywords.length };
  }
  if (!cafe.ownerAccountId) {
    console.error(`[${cafe.name}] 주인 계정 정보 없음 — 건너뜀`);
    return { cafeId, name: cafe.name, success: 0, fail: keywords.length };
  }
  const accountDoc = await Account.findOne({ accountId: cafe.ownerAccountId }).lean();
  if (!accountDoc) {
    console.error(`[${cafe.name}] 주인 계정 문서 없음: ${cafe.ownerAccountId}`);
    return { cafeId, name: cafe.name, success: 0, fail: keywords.length };
  }

  const naverAccount: NaverAccount = {
    id: accountDoc.accountId,
    password: accountDoc.password,
    nickname: accountDoc.nickname,
  };

  let success = 0;
  let fail = 0;

  for (let i = 0; i < keywords.length; i += 1) {
    const keyword = keywords[i];
    console.log(`\n===== [${cafe.name}] [${i + 1}/${keywords.length}] "${keyword}" =====`);

    try {
      const manuscript = await generateTeteContent({ keyword });
      const { subject, content } = parseManuscript(manuscript.content);
      console.log(`[${cafe.name}][원고] 유형=${manuscript.contentType} 제목="${subject}"`);

      const imageResult = await generateImages({
        keyword,
        category: manuscript.category,
        count: IMAGE_COUNT,
      });
      const base64Images: string[] = [];
      for (const url of imageResult.images || []) {
        const b64 = await downloadImageAsBase64(url);
        if (b64) base64Images.push(b64);
      }
      console.log(`[${cafe.name}][이미지] ${base64Images.length}장 준비`);

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

  return { cafeId, name: cafe.name, success, fail };
};

/**
 * 같은 주인 계정을 쓰는 카페들을 한 묶음으로 만든다.
 * 묶음끼리는 병렬, 묶음 안에서는 순차로 돌려 계정 하나가 동시에 두 카페를 쓰지 않게 한다.
 */
const groupByOwner = async (jobs: CafeJob[], userId: string): Promise<CafeJob[][]> => {
  const byOwner = new Map<string, CafeJob[]>();

  for (const job of jobs) {
    const cafe = await Cafe.findOne({ userId, cafeId: job.cafeId }).lean();
    const key = cafe?.ownerAccountId || `unknown-${job.cafeId}`;
    const bucket = byOwner.get(key) || [];
    bucket.push(job);
    byOwner.set(key, bucket);
  }

  return [...byOwner.values()];
};

const main = async () => {
  await connectDB();
  const user = await User.findOne({ loginId: LOGIN_ID }).lean();
  if (!user) throw new Error('21lab user not found');

  const needed = CAFE_IDS.length * POSTS_PER_CAFE;
  const picked = shuffle(KEYWORD_POOL).slice(0, needed);
  const jobs: CafeJob[] = CAFE_IDS.map((cafeId, idx) => ({
    cafeId,
    keywords: picked.slice(idx * POSTS_PER_CAFE, (idx + 1) * POSTS_PER_CAFE),
  }));

  const groups = await groupByOwner(jobs, user.userId);
  console.log(
    `대상 카페 ${CAFE_IDS.length}곳, 카페당 ${POSTS_PER_CAFE}편, 총 ${needed}편 발행 시작` +
      ` (계정 묶음 ${groups.length}개 병렬)`,
  );
  groups.forEach((g, i) => console.log(` 묶음${i + 1}: ${g.map((j) => j.cafeId).join(', ')}`));

  const results = await Promise.all(
    groups.map(async (group) => {
      const out = [];
      for (const job of group) {
        out.push(await publishOneCafe(job, user.userId));
      }
      return out;
    }),
  );

  const flat = results.flat();
  const totalSuccess = flat.reduce((s, r) => s + r.success, 0);
  const totalFail = flat.reduce((s, r) => s + r.fail, 0);
  console.log(`\n===== 전체 완료: 성공 ${totalSuccess} / 실패 ${totalFail} / 총 ${needed} =====`);
  flat.forEach((r) => console.log(` - ${r.name}: 성공 ${r.success} / 실패 ${r.fail}`));

  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
