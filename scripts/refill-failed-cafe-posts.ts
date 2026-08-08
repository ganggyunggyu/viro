/**
 * publish-5-new-cafes-daily 실패분 재발행 —
 * 카페 하나에 대해 지정한 키워드 목록으로 다시 발행한다.
 * 로그인 캡차 오답으로 실패한 건은 시도할 때마다 새 캡차가 나오므로
 * 키워드별로 최대 MAX_ATTEMPTS 번까지 재시도한다.
 *
 * 사용법:
 *   npx tsx --env-file=.env.local scripts/refill-failed-cafe-posts.ts <cafeId> "<키워드1>,<키워드2>,..."
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
const MAX_ATTEMPTS = 4;
const INTERVAL_MS = 10 * 60 * 1000;
const RETRY_MS = 60 * 1000;

const parseManuscript = (raw: string): { subject: string; content: string } => {
  const lines = raw.split('\n');
  const subject = lines[0]?.trim() || '';
  const content = lines.slice(1).join('\n').trim();
  return { subject, content };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  const [cafeIdArg, keywordArg] = process.argv.slice(2);
  if (!cafeIdArg || !keywordArg) {
    throw new Error('usage: refill-failed-cafe-posts.ts <cafeId> "<키워드1>,<키워드2>"');
  }
  const keywords = keywordArg.split(',').map((k) => k.trim()).filter(Boolean);

  await connectDB();
  const user = await User.findOne({ loginId: LOGIN_ID }).lean();
  if (!user) throw new Error('21lab user not found');

  const cafe = await Cafe.findOne({ userId: user.userId, cafeId: cafeIdArg }).lean();
  if (!cafe) throw new Error(`cafe not found: ${cafeIdArg}`);
  if (!cafe.ownerAccountId) throw new Error(`owner account missing: ${cafe.name}`);

  const accountDoc = await Account.findOne({ accountId: cafe.ownerAccountId }).lean();
  if (!accountDoc) throw new Error(`account doc missing: ${cafe.ownerAccountId}`);

  const naverAccount: NaverAccount = {
    id: accountDoc.accountId,
    password: accountDoc.password,
    nickname: accountDoc.nickname,
  };

  console.log(`[${cafe.name}] 재발행 ${keywords.length}편: ${keywords.join(', ')}`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < keywords.length; i += 1) {
    const keyword = keywords[i];
    console.log(`\n===== [${cafe.name}] [${i + 1}/${keywords.length}] "${keyword}" =====`);

    let posted = false;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !posted; attempt += 1) {
      try {
        const manuscript = await generateTeteContent({ keyword });
        const { subject, content } = parseManuscript(manuscript.content);
        console.log(`[${cafe.name}][원고] 시도 ${attempt}/${MAX_ATTEMPTS} 제목="${subject}"`);

        const imageResult = await generateImages({ keyword, category: manuscript.category, count: IMAGE_COUNT });
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
          posted = true;
          success += 1;
        } else {
          console.error(`[${cafe.name}][발행 실패 ${attempt}/${MAX_ATTEMPTS}] ${postResult.error}`);
        }
      } catch (error) {
        console.error(`[${cafe.name}] !!! 에러 ${attempt}/${MAX_ATTEMPTS}:`, error instanceof Error ? error.message : error);
      }

      if (!posted && attempt < MAX_ATTEMPTS) {
        console.log(`[${cafe.name}] 1분 후 재시도...`);
        await sleep(RETRY_MS);
      }
    }

    if (!posted) fail += 1;

    if (i < keywords.length - 1) {
      console.log(`[${cafe.name}] 다음 글까지 10분 대기...`);
      await sleep(INTERVAL_MS);
    }
  }

  console.log(`\n===== [${cafe.name}] 재발행 완료: 성공 ${success} / 실패 ${fail} / 총 ${keywords.length} =====`);
  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
