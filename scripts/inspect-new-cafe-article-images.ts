/**
 * 신규 카페 5개(babycare702, healthcheck702, healthinfo702, livingnote702, dailychat702)의
 * 게시글을 방문해서 본문 이미지 URL을 추출하고 스크린샷을 남긴다 (AI사진 여부 육안 확인용).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/inspect-new-cafe-article-images.ts <출력디렉토리>
 */

import { connectDB } from '../src/shared/lib/mongodb';
import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { PublishedArticle } from '../src/shared/models/published-article';
import { getCommenterAccounts } from '../src/shared/config/accounts';
import {
  acquireAccountLock,
  releaseAccountLock,
  loginAccount,
  isAccountLoggedIn,
  getPageForAccount,
  closeAllContexts,
} from '../src/shared/lib/multi-session';
import type { Frame, Page } from 'playwright';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const OUT_DIR = process.argv[2] || '.';

const NEW_CAFE_IDS = ['31754837', '31754869', '31754875', '31754939', '31755069'];

const getArticleRoot = async (page: Page): Promise<Page | Frame> => {
  try {
    await page.waitForSelector('iframe#cafe_main', { timeout: 10000 });
  } catch {
    return page;
  }
  const frameHandle = await page.$('iframe#cafe_main');
  const frame = await frameHandle?.contentFrame();
  return frame ?? page;
};

const main = async (): Promise<void> => {
  await connectDB();
  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const articles = await PublishedArticle.find({ cafeId: { $in: NEW_CAFE_IDS } })
    .select('cafeId articleId')
    .sort({ cafeId: 1, articleId: 1 })
    .lean();

  const viewers = await getCommenterAccounts(user.userId);
  const viewer = viewers.find((a) => !a.excludeFromAutoComment) || viewers[0];
  if (!viewer) throw new Error('조회용 commenter 계정 없음');

  console.log(`[INSPECT] 계정 ${viewer.id}로 게시글 ${articles.length}건 조사 시작`);

  const results: Array<{
    cafeId: string;
    articleId: number;
    url: string;
    title: string;
    imageCount: number;
    imageSrcs: string[];
    screenshot: string;
    error?: string;
  }> = [];

  await acquireAccountLock(viewer.id);
  try {
    const loggedIn = await isAccountLoggedIn(viewer.id);
    if (!loggedIn) {
      const r = await loginAccount(viewer.id, viewer.password, {
        waitForLoginMs: 60000,
        reason: 'inspect_new_cafe_article_images',
      });
      if (!r.success) throw new Error(`로그인 실패: ${r.error}`);
    }

    const page = await getPageForAccount(viewer.id);

    for (const article of articles) {
      const { cafeId, articleId } = article;
      const url = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
      const shotPath = `${OUT_DIR}/article-${cafeId}-${articleId}.png`;

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1500);

        const root = await getArticleRoot(page);

        const title = await root
          .$('h3.title_text, .tit_area .title_text, .article_title, strong.title')
          .then((el) => el?.evaluate((n) => (n.textContent ?? '').trim()))
          .catch(() => '');

        const imageSrcs = await root.$$eval(
          '.se-main-container img, .ContentRenderer img, .article_viewer img',
          (imgs) =>
            imgs
              .map((img) => (img as HTMLImageElement).src)
              .filter((src) => src && !src.includes('gif') && !src.startsWith('data:'))
        ).catch(() => [] as string[]);

        await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {});

        results.push({
          cafeId,
          articleId,
          url,
          title: title || '',
          imageCount: imageSrcs.length,
          imageSrcs,
          screenshot: shotPath,
        });

        console.log(`[INSPECT] ${cafeId}/${articleId}: 이미지 ${imageSrcs.length}개 - ${title}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        results.push({
          cafeId,
          articleId,
          url,
          title: '',
          imageCount: 0,
          imageSrcs: [],
          screenshot: shotPath,
          error: msg,
        });
        console.error(`[INSPECT] 실패 ${cafeId}/${articleId}:`, msg);
      }

      await page.waitForTimeout(800);
    }
  } finally {
    releaseAccountLock(viewer.id);
  }

  const fs = await import('fs');
  fs.writeFileSync(`${OUT_DIR}/results.json`, JSON.stringify(results, null, 2));
  console.log(`[INSPECT] 완료. 결과 저장: ${OUT_DIR}/results.json`);

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error('ERROR:', e instanceof Error ? e.message : e);
    try {
      await closeAllContexts();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
