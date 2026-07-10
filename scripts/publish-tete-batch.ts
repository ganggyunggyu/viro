/**
 * 테테 원고 발행 배치.
 *
 * 키워드 목록을 새로 만든 카페들에 라운드로빈으로 배분해서, 각 키워드마다
 * 테테로 원고를 뽑고 이미지 3장을 생성한 뒤 그 카페의 "주인 계정으로만" 발행한다.
 * (다른 댓글 계정으로 발행하지 않음 — 사용자 명시 요청.)
 *
 * 사용법:
 *   npx tsx --env-file=.env.local scripts/publish-tete-batch.ts --limit 3   # 앞에서 3개만 (검증용)
 *   npx tsx --env-file=.env.local scripts/publish-tete-batch.ts            # 전체
 */
import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { User } from '../src/shared/models/user';
import { generateTeteContent, generateImages, downloadImageAsBase64 } from '../src/shared/api/content-api';
import { writePostWithAccount } from '../src/shared/lib/naver-cafe-writing';
import type { NaverAccount } from '../src/shared/lib/account-manager';

const RAW_KEYWORDS = [
  '천안웨딩홀', '수원웨딩홀', '인천웨딩홀', '대구 가족사진', '강아지 관절 영양제',
  '인천예식장', '먹는 위고비', '부평웨딩홀', '광주웨딩홀', '부천웨딩홀',
  '일산웨딩홀', '아산카페', '신정호카페', '광주예식장', '의정부웨딩홀',
  '인천웨딩홀추천', '시스템에어컨청소업체', '청소업체추천', '방역업체', '에어컨청소업체',
  '인천방역업체', '해충방역업체', '접이식카트', '장바구니캐리어', '접이식카트',
  '울산위고비', '울산마운자로처방', '밀크씨슬', '부천pt', '드라이기',
  '드라이기', '헤어드라이기', '드라이기 추천', '미용실드라이기', '선풍기',
  '인천웨딩홀', '날개없는 선풍기', '다이아몬드가격', '다이아몬드1캐럿가격', '다이아1캐럿가격',
  '헤어에센스추천', '여성청바지', '드라이기 추천', '헤어드라이어', '미용실드라이기',
  '효성쥬얼리시티', '종로효성주얼리시티', '종로웨딩밴드', '종로반지', '종로금은방',
];

// 순서 유지 + 중복 제거
const KEYWORDS = Array.from(new Set(RAW_KEYWORDS.map((k) => k.trim())));

const TARGET_CAFE_IDS = ['31754869', '31754875', '31754939', '31754837']; // 건강체크노트/건강정보노트/생활살림노트/육아돌봄수첩

const LOGIN_ID = '21lab';

const parseManuscript = (raw: string): { subject: string; content: string } => {
  const lines = raw.split('\n');
  const subject = lines[0]?.trim() || '';
  const content = lines.slice(1).join('\n').trim();
  return { subject, content };
};

const main = async () => {
  const limitArgIndex = process.argv.indexOf('--limit');
  const limit = limitArgIndex >= 0 ? Number(process.argv[limitArgIndex + 1]) : KEYWORDS.length;
  const keywords = KEYWORDS.slice(0, limit);

  await connectDB();
  const user = await User.findOne({ loginId: LOGIN_ID }).lean();
  if (!user) throw new Error('21lab user not found');

  const cafeDocs = await Cafe.find({ userId: user.userId, cafeId: { $in: TARGET_CAFE_IDS } }).lean();
  if (cafeDocs.length !== TARGET_CAFE_IDS.length) {
    throw new Error(`카페 일부 못찾음: ${cafeDocs.length}/${TARGET_CAFE_IDS.length}`);
  }

  const ownerAccountIds = Array.from(new Set(cafeDocs.map((c) => c.ownerAccountId).filter(Boolean))) as string[];
  const ownerAccountDocs = await Account.find({ accountId: { $in: ownerAccountIds } }).lean();
  const accountByOwnerId = new Map(ownerAccountDocs.map((a) => [a.accountId, a]));

  console.log(`대상 카페 ${cafeDocs.length}개, 키워드 ${keywords.length}개 (원본 ${RAW_KEYWORDS.length}개 중 중복 제거)`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < keywords.length; i += 1) {
    const keyword = keywords[i];
    const cafe = cafeDocs[i % cafeDocs.length];
    const ownerAccountId = cafe.ownerAccountId;
    const accountDoc = ownerAccountId ? accountByOwnerId.get(ownerAccountId) : undefined;

    console.log(`\n===== [${i + 1}/${keywords.length}] "${keyword}" → ${cafe.name} (owner=${ownerAccountId}) =====`);

    if (!ownerAccountId || !accountDoc) {
      console.error('!!! 카페 주인 계정 정보 없음, 스킵');
      failCount += 1;
      continue;
    }

    try {
      const manuscript = await generateTeteContent({ keyword });
      const { subject, content } = parseManuscript(manuscript.content);
      console.log(`[원고] 유형=${manuscript.contentType} 제목="${subject}" 길이=${content.replace(/\s/g, '').length}자`);

      const imageResult = await generateImages({ keyword, category: manuscript.category, count: 3 });
      const imageUrls = imageResult.images || [];
      console.log(`[이미지] ${imageUrls.length}장 생성`);

      const base64Images: string[] = [];
      for (const url of imageUrls) {
        const b64 = await downloadImageAsBase64(url);
        if (b64) base64Images.push(b64);
      }

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
        console.log(`[발행 성공] articleId=${postResult.articleId ?? '?'}`);
        successCount += 1;
      } else {
        console.error(`[발행 실패] ${postResult.error}`);
        failCount += 1;
      }
    } catch (error) {
      console.error(`!!! 에러:`, error instanceof Error ? error.message : error);
      failCount += 1;
    }

    // 다음 키워드 전 텀
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(`\n===== 배치 완료: 성공 ${successCount} / 실패 ${failCount} / 총 ${keywords.length} =====`);
  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
