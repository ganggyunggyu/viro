/**
 * 테테 발행 - 지정한 (카페, 키워드) 쌍들을 병렬로 동시 발행.
 * 서로 다른 카페 주인 계정을 쓰므로 계정 락 충돌 없이 동시 실행 가능.
 */
import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { User } from '../src/shared/models/user';
import { generateTeteContent, generateImages, downloadImageAsBase64 } from '../src/shared/api/content-api';
import { writePostWithAccount } from '../src/shared/lib/naver-cafe-writing';
import type { NaverAccount } from '../src/shared/lib/account-manager';

const LOGIN_ID = '21lab';

const JOBS = [
  { cafeId: '31754869', keyword: '수원웨딩홀' }, // 건강 체크노트
  { cafeId: '31754875', keyword: '인천웨딩홀' }, // 건강 정보노트
  { cafeId: '31754939', keyword: '대구 가족사진' }, // 생활 살림노트
];

const parseManuscript = (raw: string): { subject: string; content: string } => {
  const lines = raw.split('\n');
  const subject = lines[0]?.trim() || '';
  const content = lines.slice(1).join('\n').trim();
  return { subject, content };
};

const publishOne = async (
  keyword: string,
  cafe: { cafeId: string; menuId: string; name: string; categories?: string[] },
  account: { accountId: string; password: string; nickname?: string },
): Promise<void> => {
  const tag = `[${cafe.name}/${keyword}]`;
  try {
    console.log(`${tag} 원고 생성 시작`);
    const manuscript = await generateTeteContent({ keyword });
    const { subject, content } = parseManuscript(manuscript.content);
    console.log(`${tag} 원고 완료 유형=${manuscript.contentType} 제목="${subject}" 길이=${content.replace(/\s/g, '').length}자`);

    // TODO: 이미지 2장 이상 삽입 시 se-popup-dim 겹침으로 발행 자체가 실패하는 버그 있음
    // (image-uploader.ts uploadSingleImageFile의 이미지버튼 stale-element 의심) — 별도 수정 전까지 1장만.
    const imageResult = await generateImages({ keyword, category: manuscript.category, count: 1 });
    const imageUrls = imageResult.images || [];
    console.log(`${tag} 이미지 ${imageUrls.length}장 생성`);

    const base64Images: string[] = [];
    for (const url of imageUrls) {
      const b64 = await downloadImageAsBase64(url);
      if (b64) base64Images.push(b64);
    }

    const naverAccount: NaverAccount = {
      id: account.accountId,
      password: account.password,
      nickname: account.nickname,
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
      console.log(`${tag} 발행 성공 articleId=${postResult.articleId ?? '?'}`);
    } else {
      console.error(`${tag} 발행 실패: ${postResult.error}`);
    }
  } catch (error) {
    console.error(`${tag} 에러:`, error instanceof Error ? error.message : error);
  }
};

const main = async () => {
  await connectDB();
  const user = await User.findOne({ loginId: LOGIN_ID }).lean();
  if (!user) throw new Error('21lab user not found');

  const cafeIds = JOBS.map((j) => j.cafeId);
  const cafeDocs = await Cafe.find({ userId: user.userId, cafeId: { $in: cafeIds } }).lean();
  const cafeById = new Map(cafeDocs.map((c) => [c.cafeId, c]));

  const ownerAccountIds = Array.from(
    new Set(cafeDocs.map((c) => c.ownerAccountId).filter(Boolean)),
  ) as string[];
  const accountDocs = await Account.find({ accountId: { $in: ownerAccountIds } }).lean();
  const accountByOwnerId = new Map(accountDocs.map((a) => [a.accountId, a]));

  const tasks = JOBS.map((job) => {
    const cafe = cafeById.get(job.cafeId);
    if (!cafe || !cafe.ownerAccountId) {
      console.error(`카페/주인계정 못찾음: ${job.cafeId}`);
      return Promise.resolve();
    }
    const account = accountByOwnerId.get(cafe.ownerAccountId);
    if (!account) {
      console.error(`주인 계정 정보 못찾음: ${cafe.ownerAccountId}`);
      return Promise.resolve();
    }
    return publishOne(job.keyword, cafe, account);
  });

  await Promise.all(tasks);
  console.log('\n===== 병렬 발행 전체 완료 =====');
  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
