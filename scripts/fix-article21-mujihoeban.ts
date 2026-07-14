/**
 * 일회성 복구 스크립트 — 건강 체크노트(cafeId 31754869) articleId=21 "무지외반증"
 * 글이 이미지만 올라가고 본문 텍스트가 유실된 채 발행됨(post-writer.ts의
 * 커서 이동 버그, 이제 placeCursorAtEndOfParagraph로 수정됨). 테테 원고를
 * 새로 받아 기존 이미지 3장과 함께 다시 채워 넣는다.
 *
 * 사용법:
 *   npx tsx --env-file=.env.local scripts/fix-article21-mujihoeban.ts
 */
import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { generateTeteContent } from '../src/shared/api/content-api';
import { modifyArticleWithAccount } from '../src/shared/lib/naver-cafe-writing';
import type { NaverAccount } from '../src/shared/lib/account-manager';

const CAFE_ID = '31754869'; // 건강 체크노트
const ARTICLE_ID = 21;
const OWNER_ACCOUNT_ID = 'ahffkekd12';
const KEYWORD = '무지외반증';

// 이미 업로드되어 있던 이미지 3장 (배치 로그에서 그대로 재사용)
const EXISTING_IMAGES = [
  'https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/ai-processed/무지외반증/20260713_fd06437b.png',
  'https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/ai-processed/무지외반증/20260713_a63b8696.png',
  'https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/ai-processed/무지외반증/20260713_bd315cf6.png',
];

const parseManuscript = (raw: string): { subject: string; content: string } => {
  const lines = raw.split('\n');
  const subject = lines[0]?.trim() || '';
  const content = lines.slice(1).join('\n').trim();
  return { subject, content };
};

const main = async () => {
  await connectDB();

  const accountDoc = await Account.findOne({ accountId: OWNER_ACCOUNT_ID }).lean();
  if (!accountDoc) throw new Error('주인 계정 정보 없음: ' + OWNER_ACCOUNT_ID);

  console.log('테테 원고 재생성 중...');
  const manuscript = await generateTeteContent({ keyword: KEYWORD });
  const { subject, content } = parseManuscript(manuscript.content);
  console.log(`[원고] 제목="${subject}" 길이=${content.replace(/\s/g, '').length}자`);

  const naverAccount: NaverAccount = {
    id: accountDoc.accountId,
    password: accountDoc.password,
    nickname: accountDoc.nickname,
  };

  const result = await modifyArticleWithAccount(naverAccount, {
    cafeId: CAFE_ID,
    articleId: ARTICLE_ID,
    newTitle: subject,
    newContent: content,
    images: EXISTING_IMAGES,
  });

  if (result.success) {
    console.log(`[복구 성공] articleId=${result.articleId}`);
  } else {
    console.error(`[복구 실패] ${result.error}`);
    process.exit(1);
  }

  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
