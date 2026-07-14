import mongoose from "mongoose";
import { Account } from "../src/shared/models/account";
import { browseCafePosts } from "../src/shared/lib/cafe-browser";
import {
  acquireAccountLock,
  releaseAccountLock,
  isAccountLoggedIn,
  loginAccount,
  getPageForAccount,
  closeAllContexts,
} from "../src/shared/lib/multi-session";

const CAFE_ID = process.argv[2] || "25460974"; // 샤넬오픈런 기본값
const WRITER_ACCOUNT_IDS = ["ags2oigb", "wound12567", "ynattg", "mixxut", "precede1451"];
const PAGES_TO_SCAN = 15;
const PER_PAGE = 50;

interface CommentEntry {
  commentId: string;
  content: string;
}

const findMyDuplicateComments = async (page: any, articleId: number): Promise<CommentEntry[]> => {
  await page.goto(`https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/${articleId}`, {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  await page.waitForTimeout(1500);

  const frameEl = await page.$("iframe#cafe_main");
  const root = frameEl ? (await frameEl.contentFrame()) || page : page;

  const mine = root.locator(".CommentItem--mine");
  const count = await mine.count().catch(() => 0);
  if (count < 2) return [];

  const entries: Array<{ id: string; content: string }> = [];
  for (let i = 0; i < count; i += 1) {
    const item = mine.nth(i);
    const idAttr = await item.getAttribute("id").catch(() => null);
    const text = await item.innerText().catch(() => "");
    if (idAttr) entries.push({ id: idAttr.replace(/^commentItem/, ""), content: text.trim() });
  }

  const seen = new Map<string, string[]>();
  for (const e of entries) {
    const arr = seen.get(e.content) || [];
    arr.push(e.id);
    seen.set(e.content, arr);
  }

  const toDelete: CommentEntry[] = [];
  for (const [content, ids] of seen.entries()) {
    if (ids.length > 1) {
      // 첫 번째만 남기고 나머지 삭제 대상
      for (const id of ids.slice(1)) {
        toDelete.push({ commentId: id, content });
      }
    }
  }
  return toDelete;
};

const deleteComment = async (page: any, commentId: string): Promise<boolean> => {
  const frameEl = await page.$("iframe#cafe_main");
  const root = frameEl ? (await frameEl.contentFrame()) || page : page;

  const moreBtn = root.locator(
    `#commentItem${commentId} button.comment_tool_button[aria-label="더보기"], #commentItem${commentId} button.comment_tool_button`,
  ).first();
  if (!(await moreBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
    console.log(`  [SKIP] ${commentId} 더보기 버튼 없음`);
    return false;
  }
  await moreBtn.click();
  await page.waitForTimeout(400);

  const deleteBtn = root.locator('button:has-text("삭제")').first();
  if (!(await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
    console.log(`  [SKIP] ${commentId} 삭제 버튼 없음`);
    return false;
  }
  await deleteBtn.click();
  await page.waitForTimeout(400);

  const confirmBtn = page.locator('button:has-text("확인")').first();
  if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmBtn.click();
  }
  await page.waitForTimeout(800);
  return true;
};

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);

  const summary: Record<string, number> = {};

  for (const accountId of WRITER_ACCOUNT_IDS) {
    const acc = await Account.findOne({ accountId }).lean();
    if (!acc) {
      console.log(`[${accountId}] 계정 없음, 스킵`);
      continue;
    }

    console.log(`\n=== ${accountId} 시작 ===`);
    await acquireAccountLock(accountId);
    let deletedCount = 0;

    try {
      const loggedIn = await isAccountLoggedIn(accountId);
      if (!loggedIn) {
        const r = await loginAccount(accountId, (acc as any).password, {
          waitForLoginMs: 60000,
          reason: "delete_dup_comments",
        });
        if (!r.success) {
          console.log(`[${accountId}] 로그인 실패: ${r.error}`);
          continue;
        }
      }

      const page = await getPageForAccount(accountId);
      page.on("dialog", async (d: any) => {
        await d.accept().catch(() => {});
      });

      const candidateArticleIds = new Set<number>();
      for (let p = 1; p <= PAGES_TO_SCAN; p += 1) {
        const result = await browseCafePosts(
          { id: accountId, password: (acc as any).password },
          CAFE_ID,
          undefined,
          { page: p, perPage: PER_PAGE },
        );
        if (!result.success || result.articles.length === 0) break;
        for (const article of result.articles) {
          if ((article.commentCount || 0) >= 3) {
            candidateArticleIds.add(article.articleId);
          }
        }
      }
      console.log(`[${accountId}] 댓글 3개 이상인 후보 글: ${candidateArticleIds.size}개`);

      for (const articleId of candidateArticleIds) {
        const toDelete = await findMyDuplicateComments(page, articleId);
        if (toDelete.length === 0) continue;

        console.log(`[${accountId}] articleId=${articleId} 중복 ${toDelete.length}건 발견`);
        for (const entry of toDelete) {
          const ok = await deleteComment(page, entry.commentId);
          if (ok) {
            deletedCount += 1;
            console.log(`  [DELETED] ${entry.commentId} - ${entry.content.slice(0, 40)}`);
          }
        }
      }
    } finally {
      releaseAccountLock(accountId);
    }

    summary[accountId] = deletedCount;
    console.log(`=== ${accountId} 완료: ${deletedCount}건 삭제 ===`);
  }

  console.log("\n=== 최종 요약 ===");
  console.log(JSON.stringify(summary, null, 2));

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error("ERROR:", e.message);
    try { await closeAllContexts(); } catch {}
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  });
