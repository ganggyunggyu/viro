import mongoose from 'mongoose';
import type { Page } from 'playwright';
import { Account, User, PublishedArticle, WorkCafeArticle, addCommentToArticle } from '../src/shared/models';
import { hasCommented } from '../src/shared/models/published-article';
import {
  getPageForAccount,
  acquireAccountLock,
  releaseAccountLock,
  isAccountLoggedIn,
  loginAccount,
  closeAllContexts,
} from '../src/shared/lib/multi-session';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { readCafeArticleContent } from '../src/shared/lib/cafe-article-reader';
import { generateCafeCommentBatch } from '../src/shared/api/cafe-comment-batch-api';

const CAFE_ID = '31746910';
const CAFE_SLUG = 'healthhhh';
const ARTICLE_ID = 46;
const OWNER_NAME = '가중건다';
const CONTAMINATED = ['h9ag469z', 'dq1h3bjy', 'hagyga', 'nes1p2kx', 'mh8j62wm'];

const BAD_TO_DELETE: Array<{ accountId: string; contentSnippet: string }> = [
  { accountId: 'hagyga', contentSnippet: '지병이 있으면 건강기능식품을 드리기 전에' },
  { accountId: 'dq1h3bjy', contentSnippet: '아침, 외출, 쉴 때, 취미 이렇게 장면별로' },
  { accountId: 'h9ag469z', contentSnippet: '최신 가전은 조작이 어려워서' },
];

const normalizeName = (v: string): string => v.replace(/\([^)]*\)/g, '').replace(/\s+/g, '').trim();
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const deleteOwnComment = async (accountId: string, password: string, contentSnippet: string): Promise<boolean> => {
  await acquireAccountLock(accountId);
  try {
    const loggedIn = await isAccountLoggedIn(accountId);
    if (!loggedIn) {
      const r = await loginAccount(accountId, password, { reason: `delete_bad_comment:${accountId}` });
      if (!r.success) {
        console.error(`[DELETE-LOGIN-FAIL] ${accountId}: ${r.error}`);
        return false;
      }
    }

    const page: Page = await getPageForAccount(accountId);
    page.on('dialog', async (d) => {
      try {
        await d.accept();
      } catch {}
    });

    await page.goto(`https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/${ARTICLE_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(2500);

    let root: Page | import('playwright').Frame = page;
    try {
      await page.waitForSelector('iframe#cafe_main', { timeout: 8000 });
      const frameHandle = await page.$('iframe#cafe_main');
      const frame = await frameHandle?.contentFrame();
      if (frame) root = frame;
    } catch {}

    const commentElements = await root.$$('.CommentItem, .comment_item');
    for (const el of commentElements) {
      const text = await el.evaluate((node) => node.textContent || '');
      if (!text.includes(contentSnippet)) continue;

      console.log(`[DELETE-FOUND] ${accountId}: "${contentSnippet.slice(0, 20)}..."`);
      const optionBtn = await el.$(
        '.comment_tool_button, button[class*="more"], button[class*="Option"], .CommentItem__button_more',
      );
      if (!optionBtn) {
        console.log(`[DELETE-FAIL] ${accountId}: 더보기 버튼 없음`);
        return false;
      }
      await optionBtn.click();
      await page.waitForTimeout(600);

      const allBtns = await root.$$('button, a');
      for (const btn of allBtns) {
        const btnText = await btn.evaluate((node) => node.textContent?.trim() || '');
        if (btnText === '삭제') {
          await btn.click();
          await page.waitForTimeout(1500);
          console.log(`[DELETE-OK] ${accountId}`);
          return true;
        }
      }
      console.log(`[DELETE-FAIL] ${accountId}: 삭제 버튼 못 찾음`);
      await page.keyboard.press('Escape');
      return false;
    }

    console.log(`[DELETE-FAIL] ${accountId}: 댓글 못 찾음(이미 삭제됐을 수 있음)`);
    return false;
  } finally {
    releaseAccountLock(accountId);
  }
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: '21lab', isActive: true }).select('userId').lean<{ userId: string } | null>();
  if (!user) throw new Error('user not found');

  const accountDocs = await Account.find({ userId: user.userId, isActive: true })
    .select('accountId password nickname role')
    .lean<Array<{ accountId: string; password: string; nickname?: string; role?: string }>>();
  const byId = new Map(accountDocs.map((a) => [a.accountId, a]));

  console.log('=== 1단계: 오염 계정 댓글 삭제 ===');
  for (const target of BAD_TO_DELETE) {
    const acc = byId.get(target.accountId);
    if (!acc) {
      console.log(`[SKIP] 계정 없음: ${target.accountId}`);
      continue;
    }
    const deleted = await deleteOwnComment(target.accountId, acc.password, target.contentSnippet);
    if (deleted) {
      await PublishedArticle.updateOne(
        { cafeId: CAFE_ID, articleId: ARTICLE_ID },
        { $pull: { comments: { accountId: target.accountId, type: 'comment' } }, $inc: { commentCount: -1 } },
      );
      await WorkCafeArticle.updateOne({ cafeId: CAFE_ID, articleId: ARTICLE_ID }, { $inc: { commentCount: -1 } });
      console.log(`[DB-SYNC] ${target.accountId} 댓글 DB에서도 제거`);
    }
    await sleep(3000);
  }

  console.log('\n=== 2단계: 대체 계정으로 재작성 ===');
  const commenters = accountDocs.filter((a) => a.role === 'commenter');
  const candidates = commenters.filter(
    (a) =>
      normalizeName(a.nickname || a.accountId) !== normalizeName(OWNER_NAME) &&
      !CONTAMINATED.includes(a.accountId),
  );

  const reader = candidates[0];
  const articleResult = await readCafeArticleContent(
    { id: reader.accountId, password: reader.password, nickname: reader.nickname || reader.accountId },
    CAFE_ID,
    ARTICLE_ID,
    { reason: `refix_read:${reader.accountId}` },
  );
  if (!articleResult.success || !articleResult.content) {
    throw new Error(`본문 읽기 실패: ${articleResult.error}`);
  }
  console.log(`[READ-OK] title="${articleResult.title}" bodyLength=${articleResult.content.length}`);

  let batch: Awaited<ReturnType<typeof generateCafeCommentBatch>> | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const candidate = await generateCafeCommentBatch({
      title: articleResult.title || String(ARTICLE_ID),
      body: articleResult.content,
      keyword: articleResult.title,
      category: CAFE_SLUG,
      exactCount: 3,
      model: 'deepseek-v4-flash',
    });
    batch = candidate;
    if (candidate.comments.length >= 3) break;
    console.log(`[GEN-RETRY ${attempt}] warnings=${candidate.warnings.join(',')}`);
  }
  if (!batch || batch.comments.length < 3) throw new Error('댓글 생성 실패');
  console.log(`[GEN-OK] ${batch.comments.length}개 생성`);

  const picked: typeof candidates = [];
  for (const acc of candidates.slice(1)) {
    if (picked.length >= 3) break;
    const already = await hasCommented(CAFE_ID, ARTICLE_ID, acc.accountId, 'comment');
    if (already) continue;
    picked.push(acc);
  }
  if (picked.length < 3) throw new Error(`대체 계정 부족: ${picked.length}/3`);

  for (let i = 0; i < 3; i += 1) {
    const account = picked[i];
    const content = batch.comments[i].content;
    console.log(`[POST ${i + 1}/3] ${account.accountId} (${account.nickname}) -> "${content}"`);
    const result = await writeCommentWithAccount(
      { id: account.accountId, password: account.password, nickname: account.nickname || account.accountId },
      CAFE_ID,
      ARTICLE_ID,
      content,
    );
    if (!result.success) {
      console.error(`[FAIL] ${account.accountId}: ${result.error}`);
      continue;
    }
    await addCommentToArticle(CAFE_ID, ARTICLE_ID, {
      accountId: account.accountId,
      nickname: account.nickname || account.accountId,
      content,
      type: 'comment',
      commentId: result.commentId,
    });
    await WorkCafeArticle.updateOne({ cafeId: CAFE_ID, articleId: ARTICLE_ID }, { $inc: { commentCount: 1 } });
    console.log(`[SUCCESS] ${account.accountId} commentId=${result.commentId}`);
    if (i < 2) await sleep(25000);
  }

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('fix-healthhhh-46 failed:', e);
    process.exit(1);
  });
