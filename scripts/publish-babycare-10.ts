/**
 * 육아 돌봄수첩(babycare702) 전용 — 테테 원고 10편을 10분 간격으로 실제 발행.
 *
 * 요청 사양: 카페 1곳만, 글 10개, 댓글은 별도 처리(여기선 안 함), 카페 주인 계정으로만,
 * 이미지 3장, 발행 간격 10분(네이버 카페 자체 예약발행 필드가 없어 실시간으로 간격을 둔다).
 *
 * 사용법:
 *   npx tsx --env-file=.env.local scripts/publish-babycare-10.ts             # 전체 10편, 10분 간격
 *   npx tsx --env-file=.env.local scripts/publish-babycare-10.ts --limit 1   # 1편만(검증용, 간격 없음)
 */
import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { User } from '../src/shared/models/user';
import { generateTeteContent, generateImages, downloadImageAsBase64 } from '../src/shared/api/content-api';
import { writePostWithAccount } from '../src/shared/lib/naver-cafe-writing';
import type { NaverAccount } from '../src/shared/lib/account-manager';

// 이미 발행된 5개(천안웨딩홀/수원웨딩홀/인천웨딩홀/인천예식장/강아지 관절 영양제)는 웨딩홀·예식장 쪽에
// 쏠려있어서, 남은 5개는 완전히 다른 카테고리로 채워 전체 10편의 다양성을 맞춘다.
const KEYWORDS = [
  '종로반지', '먹는 위고비', '시스템에어컨청소업체', '드라이기 추천', '부천pt',
];

const CAFE_ID = '31754837'; // 육아 돌봄수첩
const IMAGE_COUNT = 3;
const INTERVAL_MS = 10 * 60 * 1000; // 10분
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
  const applyInterval = limit >= KEYWORDS.length; // --limit로 소수만 돌릴 땐 간격 생략(검증용)

  await connectDB();
  const user = await User.findOne({ loginId: LOGIN_ID }).lean();
  if (!user) throw new Error('21lab user not found');

  const cafe = await Cafe.findOne({ userId: user.userId, cafeId: CAFE_ID }).lean();
  if (!cafe) throw new Error('카페 못찾음: ' + CAFE_ID);
  if (!cafe.ownerAccountId) throw new Error('카페 주인 계정 정보 없음');

  const accountDoc = await Account.findOne({ accountId: cafe.ownerAccountId }).lean();
  if (!accountDoc) throw new Error('주인 계정 문서 없음: ' + cafe.ownerAccountId);

  console.log(`대상: ${cafe.name} (${CAFE_ID}), 주인 계정: ${cafe.ownerAccountId}, 글 ${keywords.length}개, 이미지 ${IMAGE_COUNT}장, 간격 ${applyInterval ? '10분' : '없음(검증모드)'}`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < keywords.length; i += 1) {
    const keyword = keywords[i];
    console.log(`\n===== [${i + 1}/${keywords.length}] "${keyword}" =====`);

    try {
      const manuscript = await generateTeteContent({ keyword });
      const { subject, content } = parseManuscript(manuscript.content);
      console.log(`[원고] 유형=${manuscript.contentType} 제목="${subject}" 길이=${content.replace(/\s/g, '').length}자`);

      const imageResult = await generateImages({ keyword, category: manuscript.category, count: IMAGE_COUNT });
      const imageUrls = imageResult.images || [];
      console.log(`[이미지] ${imageUrls.length}장 생성`);

      const base64Images: string[] = [];
      for (const url of imageUrls) {
        const b64 = await downloadImageAsBase64(url);
        if (b64) base64Images.push(b64);
      }
      console.log(`[이미지] ${base64Images.length}장 다운로드 완료`);

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

    if (applyInterval && i < keywords.length - 1) {
      console.log(`[대기] 다음 글까지 10분 대기...`);
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    } else if (i < keywords.length - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log(`\n===== 완료: 성공 ${successCount} / 실패 ${failCount} / 총 ${keywords.length} =====`);
  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
