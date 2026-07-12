/**
 * replace-nonai-images.ts 와 동일하게 "실제 원문 + 실제 AI 이미지 3장"으로 진행하되,
 * 저장이 왜 반영되지 않는지 확인하기 위해 제출 전후 네트워크/다이얼로그/에러토스트를 모니터링한다.
 * 플레이스홀더/더미 텍스트는 사용하지 않고 라이브 글의 실제 원문을 그대로 재입력한다.
 *
 * 대상: 31754837/7 (1차 시도에서 저장 미반영 확인된 글, 원본 훼손 없음 재확인됨)
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/replace-nonai-images-debug.ts
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
import type { Frame, Page } from 'playwright';

const SUBTITLE_PATTERN = /^\d+\.\s*/;
const CAFE_ID = '31754837';
const ARTICLE_ID = 7;
const OWNER_ACCOUNT_ID = 'ahffkdlek12';
const KEYWORD = '신생아 수유텀';
const CATEGORY = '육아';

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

// article-modifier.ts 의 groupLinesIntoParagraphs 와 동일 로직 (실제 원문 줄바꿈 재구성용)
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

const main = async (): Promise<void> => {
  await connectDB();
  const accounts = await getAllAccountsForMonitoring();
  const account = accounts.find((a) => a.id === OWNER_ACCOUNT_ID);
  if (!account) throw new Error('카페장 계정 없음');
  const { id, password } = account;

  // 1) 읽기 전용: 실제 원문 추출
  await acquireAccountLock(id);
  let title = '';
  let rawLines: string[] = [];
  try {
    const loggedIn = await isAccountLoggedIn(id);
    if (!loggedIn) {
      const r = await loginAccount(id, password, { waitForLoginMs: 60000, reason: 'debug_read' });
      if (!r.success) throw new Error('로그인 실패: ' + r.error);
    }
    const page = await getPageForAccount(id);
    await page.goto(`https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/${ARTICLE_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(1500);
    const root = await getArticleRoot(page);
    const extracted = await extractTitleAndLines(root);
    title = extracted.title;
    rawLines = extracted.lines;
    console.log(`[READ] 제목="${title}", 원문 줄수=${rawLines.length}`);
  } finally {
    releaseAccountLock(id);
  }

  if (!title || rawLines.length === 0) throw new Error('원문 추출 실패 - 중단');

  // 2) AI 이미지 3장 생성 (실제)
  console.log('[IMAGE] AI 이미지 3장 생성 요청:', KEYWORD);
  const imageResult = await generateImages({ keyword: KEYWORD, category: CATEGORY, count: 3 });
  if (!imageResult.success || !imageResult.images || imageResult.images.length === 0) {
    throw new Error('이미지 생성 실패: ' + imageResult.error);
  }
  console.log('[IMAGE] 생성 완료:', imageResult.images);

  // 3) 실제 수정 (모니터링 추가)
  await acquireAccountLock(id);
  try {
    const loggedIn = await isAccountLoggedIn(id);
    if (!loggedIn) {
      const r = await loginAccount(id, password, { waitForLoginMs: 60000, reason: 'debug_modify' });
      if (!r.success) throw new Error('로그인 실패: ' + r.error);
    }

    const page = await getPageForAccount(id);

    page.on('response', (res) => {
      const method = res.request().method();
      const url = res.url();
      if (method === 'POST' || url.includes('ArticleWrite') || url.includes('modify')) {
        console.log(`[NETWORK] ${method} ${res.status()} ${url}`);
      }
    });
    page.on('dialog', async (dialog) => {
      console.log('[DIALOG]', dialog.type(), '|', dialog.message());
      try {
        await dialog.accept();
      } catch {}
    });
    page.on('pageerror', (err) => console.log('[PAGE-ERROR]', err.message));

    const modifyUrl = `https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/${ARTICLE_ID}/modify`;
    await page.goto(modifyUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (isLoginRedirect(page.url())) {
      invalidateLoginCache(id);
      await loginAccount(id, password, {
        waitForLoginMs: 60000,
        reason: 'debug_modify_redirect',
        forceFreshLogin: true,
      });
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
    if (!titleInput) throw new Error('제목 입력창 없음');
    await titleInput.click({ clickCount: 3 });
    await page.waitForTimeout(200);
    await titleInput.fill(title); // 실제 원제목 그대로
    await page.waitForTimeout(500);

    const contentArea = await page.$('p.se-text-paragraph');
    if (!contentArea) throw new Error('본문 입력창 없음');
    await contentArea.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Meta+A');
    await page.waitForTimeout(200);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(300);

    const lines = groupLinesIntoParagraphs(rawLines); // 실제 원문 그대로 재구성
    const subtitleIndices: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (SUBTITLE_PATTERN.test(lines[i].trim())) subtitleIndices.push(i);
    }

    const imageQueue = [...imageResult.images];
    console.log(`[MODIFY] 부제 ${subtitleIndices.length}개, 이미지 ${imageQueue.length}장, 총 줄수 ${lines.length}`);

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
          console.log(`[MODIFY] 부제 ${i + 1} 아래 이미지 삽입`);
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

    // 기존 로직 대비 안정화 대기를 늘려서 이미지 처리(서버 변환) 완료를 기다림
    console.log('[WAIT] 이미지 처리 안정화 대기 (5초)');
    await page.waitForTimeout(5000);

    const imgComponentCount = await page.$$eval('.se-image-resource', (els) => els.length);
    console.log('[CHECK] 제출 전 에디터 내 이미지 컴포넌트 수:', imgComponentCount);
    console.log('URL_BEFORE_SUBMIT:', page.url());

    const submitButton = await page.$('a.BaseButton--skinGreen, a.BaseButton');
    if (!submitButton) throw new Error('제출 버튼 없음');

    console.log('[ACTION] 제출 버튼 클릭');
    await submitButton.click();

    await page.waitForTimeout(4000);
    console.log('URL_AFTER_SUBMIT_4S:', page.url());

    const errorToast = await page
      .$$eval('.error_message, .toast_message, [class*="error"], [class*="Error"]', (els) =>
        els.map((el) => (el.textContent || '').trim()).filter(Boolean)
      )
      .catch(() => [] as string[]);
    console.log('POSSIBLE_ERROR_TEXT:', JSON.stringify(errorToast));

    await page.screenshot({ path: './_tmp/new-cafe-inspect/debug-after-submit.png', fullPage: true });

    await page.waitForTimeout(3000);
    console.log('FINAL_URL:', page.url());

    await saveCookiesForAccount(id);
  } finally {
    releaseAccountLock(id);
  }

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
