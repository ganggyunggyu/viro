/**
 * 신규 카페(babycare702, healthcheck702) 게시글 중 non-AI 사진(실사/템플릿그래픽/워터마크 다이어그램)이
 * 들어간 6개 글을 찾아 AI 생성 이미지 3장으로 교체한다.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/replace-nonai-images.ts
 */

import { connectDB } from '../src/shared/lib/mongodb';
import mongoose from 'mongoose';
import { getAllAccountsForMonitoring } from '../src/shared/config/accounts';
import { generateImages } from '../src/shared/api/content-api';
import { modifyArticleWithAccount } from '../src/shared/lib/naver-cafe-writing/article-modifier';
import {
  acquireAccountLock,
  releaseAccountLock,
  loginAccount,
  isAccountLoggedIn,
  getPageForAccount,
  saveCookiesForAccount,
  closeAllContexts,
} from '../src/shared/lib/multi-session';
import type { Frame, Page } from 'playwright';

interface Target {
  cafeId: string;
  articleId: number;
  ownerAccountId: string;
  keyword: string;
  category: string;
}

const TARGETS: Target[] = [
  { cafeId: '31754837', articleId: 7, ownerAccountId: 'ahffkdlek12', keyword: '신생아 수유텀', category: '육아' },
  { cafeId: '31754837', articleId: 8, ownerAccountId: 'ahffkdlek12', keyword: '아기 이유식', category: '육아' },
  { cafeId: '31754837', articleId: 9, ownerAccountId: 'ahffkdlek12', keyword: '아기 수면교육', category: '육아' },
  { cafeId: '31754837', articleId: 10, ownerAccountId: 'ahffkdlek12', keyword: '영유아 예방접종', category: '육아' },
  { cafeId: '31754869', articleId: 9, ownerAccountId: 'ahffkekd12', keyword: '위산 역류', category: '건강' },
  { cafeId: '31754869', articleId: 10, ownerAccountId: 'ahffkekd12', keyword: '체지방률', category: '건강' },
];

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

const extractTitleAndLines = async (
  root: Page | Frame
): Promise<{ title: string; lines: string[] }> => {
  const title = await root
    .$('h3.title_text, .tit_area .title_text, .article_title, strong.title')
    .then((el) => el?.evaluate((n) => (n.textContent ?? '').trim()))
    .catch(() => '');

  const lines = await root
    .$$eval('.se-main-container p.se-text-paragraph, .se-main-container .se-component.se-text', (nodes) =>
      nodes.map((n) => (n.textContent ?? '').trim())
    )
    .catch(() => [] as string[]);

  return { title: title || '', lines: lines.filter(Boolean) };
};

const main = async (): Promise<void> => {
  await connectDB();

  const allAccounts = await getAllAccountsForMonitoring();
  const results: Array<{ cafeId: string; articleId: number; success: boolean; error?: string }> = [];

  for (const target of TARGETS) {
    const account = allAccounts.find((a) => a.id === target.ownerAccountId);
    if (!account) {
      console.error(`[REPLACE] ${target.cafeId}/${target.articleId}: 카페장 계정(${target.ownerAccountId}) 없음`);
      results.push({ cafeId: target.cafeId, articleId: target.articleId, success: false, error: '카페장 계정 없음' });
      continue;
    }

    console.log(`\n=== ${target.cafeId}/${target.articleId} (${target.keyword}) ===`);

    await acquireAccountLock(account.id);
    let title = '';
    let lines: string[] = [];
    try {
      const loggedIn = await isAccountLoggedIn(account.id);
      if (!loggedIn) {
        const r = await loginAccount(account.id, account.password, {
          waitForLoginMs: 60000,
          reason: `replace_nonai_read:${account.id}`,
        });
        if (!r.success) throw new Error(`로그인 실패: ${r.error}`);
      }

      const page = await getPageForAccount(account.id);
      const url = `https://cafe.naver.com/ca-fe/cafes/${target.cafeId}/articles/${target.articleId}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);

      const root = await getArticleRoot(page);
      const extracted = await extractTitleAndLines(root);
      title = extracted.title;
      lines = extracted.lines;

      console.log(`[REPLACE] 원문 추출: 제목="${title}", 본문 줄수=${lines.length}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[REPLACE] 원문 추출 실패:`, msg);
      results.push({ cafeId: target.cafeId, articleId: target.articleId, success: false, error: `원문추출실패: ${msg}` });
      releaseAccountLock(account.id);
      continue;
    }
    releaseAccountLock(account.id);

    if (!title || lines.length === 0) {
      results.push({
        cafeId: target.cafeId,
        articleId: target.articleId,
        success: false,
        error: '원문 추출 결과 비어있음',
      });
      continue;
    }

    console.log(`[REPLACE] AI 이미지 3장 생성 요청: ${target.keyword}`);
    const imageResult = await generateImages({ keyword: target.keyword, category: target.category, count: 3 });
    if (!imageResult.success || !imageResult.images || imageResult.images.length === 0) {
      console.error(`[REPLACE] 이미지 생성 실패:`, imageResult.error);
      results.push({
        cafeId: target.cafeId,
        articleId: target.articleId,
        success: false,
        error: `이미지생성실패: ${imageResult.error}`,
      });
      continue;
    }
    console.log(`[REPLACE] AI 이미지 ${imageResult.images.length}장 생성 완료`);

    const modifyResult = await modifyArticleWithAccount(account, {
      cafeId: target.cafeId,
      articleId: target.articleId,
      newTitle: title,
      newContent: lines.join('\n'),
      images: imageResult.images,
    });

    if (modifyResult.success) {
      console.log(`[REPLACE] 수정 완료: ${target.cafeId}/${target.articleId}`);
    } else {
      console.error(`[REPLACE] 수정 실패: ${modifyResult.error}`);
    }

    results.push({
      cafeId: target.cafeId,
      articleId: target.articleId,
      success: modifyResult.success,
      error: modifyResult.error,
    });
  }

  console.log('\n=== 최종 결과 ===');
  console.log(JSON.stringify(results, null, 2));

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
