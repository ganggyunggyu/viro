/**
 * 이미지 없이 나간 맛집 글에 이미지 3장을 붙인다.
 * 원고(제목·본문)는 라이브에서 그대로 읽어와 유지하고 이미지만 추가한다.
 */
import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { browseCafePosts } from '../src/shared/lib/cafe-browser';
import { readCafeArticleContent } from '../src/shared/lib/cafe-article-reader';
import { modifyArticleWithAccount } from '../src/shared/lib/naver-cafe-writing/article-modifier';
import { generateImages, downloadImageAsBase64 } from '../src/shared/api/content-api';
import type { NaverAccount } from '../src/shared/lib/account-manager';

const LAB_USER_ID = 'user-1768955529317';
const CAFE_IDS = ['31766236', '31766237', '31766238'];
const IMAGE_COUNT = 3;
const DRY_RUN = process.env.DRY_RUN === '1';

const toKstDateKey = (ts: number): string =>
  new Date(ts + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

const extractKeyword = (title: string): string => {
  const m = title.match(/([가-힣A-Za-z0-9]+맛집|맛집\s*[가-힣]+)/);
  return m?.[1] || title.split(/\s+/).slice(0, 2).join(' ');
};

const main = async () => {
  await connectDB();
  const today = toKstDateKey(Date.now());
  let ok = 0;
  let fail = 0;

  for (const cafeId of CAFE_IDS) {
    const cafe = await Cafe.findOne({ userId: LAB_USER_ID, cafeId }).lean();
    if (!cafe?.ownerAccountId) continue;
    const accountDoc = await Account.findOne({
      accountId: cafe.ownerAccountId,
      userId: LAB_USER_ID,
    }).lean();
    if (!accountDoc) continue;

    const account: NaverAccount = {
      id: accountDoc.accountId,
      password: accountDoc.password,
      nickname: accountDoc.nickname,
    };

    const listed = await browseCafePosts(account, cafeId, undefined, {
      page: 1,
      perPage: 20,
      cafeUrl: cafe.cafeUrl,
    });
    if (!listed.success) {
      console.log(`[${cafe.name}] 목록 실패: ${listed.error}`);
      continue;
    }

    const todays = listed.articles.filter((a) => toKstDateKey(a.writeDateTimestamp) === today);
    console.log(`\n===== ${cafe.name} · 대상 ${todays.length}건 =====`);

    for (const article of todays) {
      const read = await readCafeArticleContent(account, cafeId, article.articleId, {
        reason: 'add_images',
      });
      if (!read.success || !read.content) {
        console.log(`  #${article.articleId} 본문 읽기 실패: ${read.error}`);
        fail += 1;
        continue;
      }

      const title = read.title || article.subject;
      const keyword = extractKeyword(title);

      const imageResult = await generateImages({ keyword, category: '맛집', count: IMAGE_COUNT });
      const urls = imageResult.images || [];
      const base64Images: string[] = [];
      for (const url of urls) {
        const b64 = await downloadImageAsBase64(url);
        if (b64) base64Images.push(b64);
      }

      if (base64Images.length === 0) {
        console.log(`  #${article.articleId} 이미지 생성 실패 — 건너뜀`);
        fail += 1;
        continue;
      }

      console.log(`  #${article.articleId} "${title}" · 이미지 ${base64Images.length}장 준비`);
      if (DRY_RUN) {
        ok += 1;
        continue;
      }

      const modified = await modifyArticleWithAccount(account, {
        cafeId,
        articleId: article.articleId,
        newTitle: title,
        newContent: read.content,
        images: base64Images,
      });

      if (modified.success) {
        console.log(`  #${article.articleId} 이미지 추가 완료`);
        ok += 1;
      } else {
        console.log(`  #${article.articleId} 수정 실패: ${modified.error}`);
        fail += 1;
      }
    }
  }

  console.log(`\n===== 완료: 성공 ${ok} / 실패 ${fail} =====`);
  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
