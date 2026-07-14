/**
 * 신규 카페(babycare702, healthcheck702) non-AI 사진 게시글을 AI 이미지 3장으로 교체한다.
 * 31754837/7 은 이미 처리 완료 (제외).
 *
 * article-modifier.ts의 modifyArticleWithAccount는 마지막 이미지 업로드 직후 바로 제출 버튼을
 * 클릭해서 Naver 에디터 상태가 안정되기 전에 제출되는 문제가 있음 (URL 변화 체크도
 * /modify 자체가 정규식에 걸려 거짓 성공을 보고함). 제출 전 5초 안정화 대기를 추가해서 우회함.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/replace-nonai-images-batch.ts
 */

import { connectDB } from '../src/shared/lib/mongodb';
import mongoose from 'mongoose';
import { getAllAccountsForMonitoring } from '../src/shared/config/accounts';
import { generateImages } from '../src/shared/api/content-api';
import {
  acquireAccountLock,
  releaseAccountLock,
  loginAccount,
  isAccountLoggedIn,
  getPageForAccount,
  saveCookiesForAccount,
  closeAllContexts,
  isLoginRedirect,
  invalidateLoginCache,
} from '../src/shared/lib/multi-session';
import { uploadSingleImage, uploadImages } from '../src/shared/lib/naver-cafe-writing/image-uploader';
import type { NaverAccount } from '../src/shared/lib/account-manager';
import type { Frame, Page } from 'playwright';

const SUBTITLE_PATTERN = /^\d+\.\s*/;

interface Target {
  cafeId: string;
  articleId: number;
  ownerAccountId: string;
  keyword: string;
  category: string;
}

const TARGETS: Target[] = [
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

const extractTitleAndLines = async (root: Page | Frame): Promise<{ title: string; lines: string[] }> => {
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

const groupLinesIntoParagraphs = (rawLines: string[]): string[] => {
  const items = rawLines.map((l) => l.trim()).filter(Boolean);
  const grouped: string[] = [];
  let i = 0;
  while (i < items.length) {
    if (SUBTITLE_PATTERN.test(items[i])) {
      if (grouped.length > 0 && grouped[grouped.length - 1] !== '') grouped.push('');
      grouped.push(items[i]);
      grouped.push('');
      i++;
      continue;
    }
    const groupSize = 2 + Math.floor(Math.random() * 3);
    let taken = 0;
    while (taken < groupSize && i < items.length && !SUBTITLE_PATTERN.test(items[i])) {
      grouped.push(items[i]);
      i++;
      taken++;
    }
    if (i < items.length) grouped.push('');
  }
  return grouped;
};

const readOriginal = async (
  account: NaverAccount,
  cafeId: string,
  articleId: number
): Promise<{ title: string; lines: string[] }> => {
  const { id, password } = account;
  await acquireAccountLock(id);
  try {
    const loggedIn = await isAccountLoggedIn(id);
    if (!loggedIn) {
      const r = await loginAccount(id, password, { waitForLoginMs: 60000, reason: `batch_read:${id}` });
      if (!r.success) throw new Error('로그인 실패: ' + r.error);
    }
    const page = await getPageForAccount(id);
    await page.goto(`https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(1500);
    const root = await getArticleRoot(page);
    return await extractTitleAndLines(root);
  } finally {
    releaseAccountLock(id);
  }
};

const modifyWithStabilization = async (
  account: NaverAccount,
  cafeId: string,
  articleId: number,
  title: string,
  rawLines: string[],
  images: string[]
): Promise<{ success: boolean; error?: string }> => {
  const { id, password } = account;
  await acquireAccountLock(id);
  try {
    const loggedIn = await isAccountLoggedIn(id);
    if (!loggedIn) {
      const r = await loginAccount(id, password, { waitForLoginMs: 60000, reason: `batch_modify:${id}` });
      if (!r.success) return { success: false, error: '로그인 실패: ' + r.error };
    }

    const page = await getPageForAccount(id);
    page.on('dialog', async (dialog) => {
      try {
        await dialog.accept();
      } catch {}
    });

    const modifyUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}/modify`;
    await page.goto(modifyUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (isLoginRedirect(page.url())) {
      invalidateLoginCache(id);
      const relogin = await loginAccount(id, password, {
        waitForLoginMs: 60000,
        reason: `batch_modify_redirect:${id}`,
        forceFreshLogin: true,
      });
      if (!relogin.success) return { success: false, error: '재로그인 실패: ' + relogin.error };
      await page.goto(modifyUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    await page.waitForSelector(
      'p.se-text-paragraph, .FlexableTextArea textarea.textarea_input, .se-component-content',
      { timeout: 15000 }
    );
    await page.waitForTimeout(2000);

    const titleInput = await page.$(
      '.FlexableTextArea textarea.textarea_input, textarea.textarea_input, textarea[placeholder*="제목"], input[placeholder*="제목"]'
    );
    if (!titleInput) return { success: false, error: '제목 입력창 없음' };
    await titleInput.click({ clickCount: 3 });
    await page.waitForTimeout(200);
    await titleInput.fill(title);
    await page.waitForTimeout(500);

    const contentArea = await page.$('p.se-text-paragraph');
    if (!contentArea) return { success: false, error: '본문 입력창 없음' };
    await contentArea.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Meta+A');
    await page.waitForTimeout(200);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(300);

    const lines = groupLinesIntoParagraphs(rawLines);
    const subtitleIndices: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (SUBTITLE_PATTERN.test(lines[i].trim())) subtitleIndices.push(i);
    }

    const imageQueue = [...images];
    console.log(`[MODIFY] ${cafeId}/${articleId}: 부제 ${subtitleIndices.length}개, 이미지 ${imageQueue.length}장, 총 줄수 ${lines.length}`);

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim()) {
        await page.keyboard.type(lines[i], { delay: 100 });
      }
      if (i < lines.length - 1) await page.keyboard.press('Enter');

      if (imageQueue.length > 0 && subtitleIndices.includes(i)) {
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        const img = imageQueue.shift();
        if (img) {
          await uploadSingleImage(page, img);
          await page.waitForTimeout(500);
          const newContentArea = await page.$('p.se-text-paragraph');
          if (newContentArea) await newContentArea.click();
          await page.keyboard.press('End');
          await page.keyboard.press('Enter');
        }
      }
    }

    await page.waitForTimeout(500);
    if (imageQueue.length > 0) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      await uploadImages(page, imageQueue);
      await page.waitForTimeout(1000);
    }

    console.log(`[MODIFY] ${cafeId}/${articleId}: 이미지 처리 안정화 대기 (5초)`);
    await page.waitForTimeout(5000);

    const submitButton = await page.$('a.BaseButton--skinGreen, a.BaseButton');
    if (!submitButton) return { success: false, error: '제출 버튼 없음' };

    const urlBefore = page.url();
    await submitButton.click();
    await page.waitForTimeout(4000);
    const urlAfter = page.url();

    await saveCookiesForAccount(id);

    const actuallyNavigated = urlAfter !== urlBefore && !urlAfter.includes('/modify');
    if (!actuallyNavigated) {
      return { success: false, error: `제출 후 URL 변화 없음 (before=${urlBefore}, after=${urlAfter})` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    releaseAccountLock(id);
  }
};

const main = async (): Promise<void> => {
  await connectDB();
  const accounts = await getAllAccountsForMonitoring();
  const results: Array<{ cafeId: string; articleId: number; success: boolean; error?: string }> = [];

  for (const target of TARGETS) {
    console.log(`\n=== ${target.cafeId}/${target.articleId} (${target.keyword}) ===`);
    const account = accounts.find((a) => a.id === target.ownerAccountId);
    if (!account) {
      results.push({ cafeId: target.cafeId, articleId: target.articleId, success: false, error: '카페장 계정 없음' });
      continue;
    }

    let title = '';
    let rawLines: string[] = [];
    try {
      const extracted = await readOriginal(account, target.cafeId, target.articleId);
      title = extracted.title;
      rawLines = extracted.lines;
      console.log(`[READ] 제목="${title}", 원문 줄수=${rawLines.length}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      results.push({ cafeId: target.cafeId, articleId: target.articleId, success: false, error: `읽기실패: ${msg}` });
      continue;
    }

    if (!title || rawLines.length === 0) {
      results.push({ cafeId: target.cafeId, articleId: target.articleId, success: false, error: '원문 비어있음' });
      continue;
    }

    console.log(`[IMAGE] AI 이미지 3장 생성 요청: ${target.keyword}`);
    const imageResult = await generateImages({ keyword: target.keyword, category: target.category, count: 3 });
    if (!imageResult.success || !imageResult.images || imageResult.images.length === 0) {
      results.push({
        cafeId: target.cafeId,
        articleId: target.articleId,
        success: false,
        error: `이미지생성실패: ${imageResult.error}`,
      });
      continue;
    }
    console.log(`[IMAGE] 생성 완료: ${imageResult.images.length}장`);

    const modifyResult = await modifyWithStabilization(
      account,
      target.cafeId,
      target.articleId,
      title,
      rawLines,
      imageResult.images
    );

    if (modifyResult.success) {
      console.log(`[MODIFY] 성공: ${target.cafeId}/${target.articleId}`);
    } else {
      console.error(`[MODIFY] 실패: ${modifyResult.error}`);
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
