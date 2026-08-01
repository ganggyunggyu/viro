/**
 * 신규 맛집카페 3곳(맛집 미식노트/맛집 한끼일기/맛집 맛기행) 전용 —
 * 카페당 맛집1/맛집2 원고 3편씩(이미지 3장) 발행. 매일 오전 9시 스케줄 태스크에서 호출됨.
 *
 * 원고는 다붓 백엔드(21lab 계정)의 "맛집1"/"맛집2" 프로젝트 전용 엔드포인트
 * (/generate/restaurant/v1, /v2)로 생성한다 — 범용 테테 원고와 달리 실제 업체(주소·메뉴·
 * 가격·영업시간)를 백엔드가 네이버로 직접 검색해 확인하고 쓰는 전용 파이프라인이라 반드시
 * 이 엔드포인트를 거쳐야 한다. 글마다 맛집1/맛집2를 번갈아 사용한다.
 *
 * 카페마다 주인 계정이 달라 락 충돌이 없으므로 3개 카페를 병렬로 돌리고,
 * 같은 카페 안에서는(같은 계정 반복 사용) 네이버 실시간 발행 간격을 10분 두어
 * 계정 하나가 짧은 시간에 여러 번 글을 쓰지 않게 한다(네이버 자체 예약발행 필드가 없음).
 *
 * 사용법:
 *   npx tsx --env-file=.env.local scripts/publish-3-matjip-cafes-daily.ts
 */
import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { User } from '../src/shared/models/user';
import {
  generateRestaurantV1Content,
  generateRestaurantV2Content,
  generateImages,
  downloadImageAsBase64,
} from '../src/shared/api/content-api';
import { writePostWithAccount } from '../src/shared/lib/naver-cafe-writing';
import type { NaverAccount } from '../src/shared/lib/account-manager';

const LOGIN_ID = '21lab';
const IMAGE_COUNT = 3;
const POSTS_PER_CAFE = 3;
const INTERVAL_MS = 10 * 60 * 1000; // 10분

const CAFE_IDS = [
  '31766236', // 맛집 미식노트
  '31766237', // 맛집 한끼일기
  '31766238', // 맛집 맛기행
];

// 맛집2 전용 캐릭터명 — blog_name 미지정시 서버가 임의 배정하므로 명시적으로 순환시킨다.
const MATJIP2_BLOG_NAMES = ['블루망고', '제이제이', '삼남매', '사랑채', '호이호이', '바글바글'];

const KEYWORD_POOL = [
  '부산맛집', '강남맛집', '홍대맛집', '인천맛집', '대구맛집', '광주맛집', '제주맛집', '대전맛집',
  '을지로맛집', '성수동맛집', '연남동맛집', '경리단길맛집',
  '혼밥맛집', '가족모임맛집', '데이트맛집', '단체회식맛집',
  '고기맛집', '스시맛집', '파스타맛집', '중식맛집', '한정식맛집', '분식맛집',
  '브런치카페', '오마카세', '냉면맛집', '삼겹살맛집', '곱창맛집', '국밥맛집',
  '맛집 웨이팅', '맛집 예약', '숨은맛집', '동네맛집 추천',
];

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// 맛집2 응답은 제목 줄 앞에 "[제목]" 같은 템플릿 라벨이 그대로 섞여 나올 때가 있어 제거한다.
const TITLE_LABEL_PREFIX_PATTERN = /^\[?제목\]?[:\s]*/;

const parseManuscript = (raw: string): { subject: string; content: string } => {
  const lines = raw.split('\n');
  const subject = (lines[0]?.trim() || '').replace(TITLE_LABEL_PREFIX_PATTERN, '').trim();
  const content = lines.slice(1).join('\n').trim();
  return { subject, content };
};

let globalArticleIndex = 0;
let blogNameCursor = 0;

const generateMatjipManuscript = async (keyword: string): Promise<{ subject: string; content: string; engine: string }> => {
  const useV2 = globalArticleIndex % 2 === 1; // 맛집1 → 맛집2 → 맛집1 ... 번갈아
  globalArticleIndex += 1;

  if (useV2) {
    const blogName = MATJIP2_BLOG_NAMES[blogNameCursor % MATJIP2_BLOG_NAMES.length];
    blogNameCursor += 1;
    const result = await generateRestaurantV2Content({ keyword, blogName });
    const { subject, content } = parseManuscript(result.content);
    return { subject, content, engine: `맛집2:${blogName}` };
  }

  const result = await generateRestaurantV1Content({ keyword });
  const { subject, content } = parseManuscript(result.content);
  return { subject, content, engine: '맛집1' };
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
      const { subject, content, engine } = await generateMatjipManuscript(keyword);
      console.log(`[${cafe.name}][원고] 엔진=${engine} 제목="${subject}" 글자수=${content.replace(/\s/g, '').length}`);

      const imageResult = await generateImages({ keyword, category: '맛집', count: IMAGE_COUNT });
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

  console.log(`대상 카페 ${CAFE_IDS.length}곳, 카페당 ${POSTS_PER_CAFE}편, 총 ${needed}편 발행 시작 (맛집1/맛집2 번갈아)`);
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
