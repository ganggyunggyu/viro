import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import type { Frame, Page } from "playwright";

type Root = Page | Frame;

interface LiveComment {
  commentId: string;
  nickname: string;
  content: string;
  text: string;
}

const CAFE_ID = process.env.TARGET_CAFE_ID || "31754869";
const CAFE_URL_SLUG = process.env.TARGET_CAFE_SLUG || "healthcheck702";
const ARTICLE_ID = Number(process.env.TARGET_ARTICLE_ID || "17");
const OWNER_ACCOUNT_ID = process.env.OWNER_ACCOUNT_ID || "ahffkekd12";
const NEW_COMMENT_COUNT = Number(process.env.NEW_COMMENT_COUNT || "3");

const getCommentRoot = async (page: Page): Promise<Root> => {
  try {
    await page.waitForSelector("iframe#cafe_main", { timeout: 3000 });
    const frameHandle = await page.$("iframe#cafe_main");
    const frame = await frameHandle?.contentFrame();
    return frame ?? page;
  } catch {
    return page;
  }
};

const mobileUrl = (): string =>
  `https://m.cafe.naver.com/ca-fe/web/cafes/${CAFE_URL_SLUG}/articles/${ARTICLE_ID}?useCafeId=false`;

const extractLiveComments = async (page: Page): Promise<LiveComment[]> => {
  await page.goto(mobileUrl(), { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2500);
  const root = await getCommentRoot(page);

  for (let i = 0; i < 5; i++) {
    try {
      await root.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await root.waitForTimeout(500);
    } catch {}
  }

  return root.evaluate(() => {
    const pickText = (node: Element, selectors: string[]): string => {
      for (const selector of selectors) {
        const found = node.querySelector(selector);
        const text = found?.textContent?.trim();
        if (text) return text;
      }
      return "";
    };
    const containerSelector = [
      ".CommentItem", ".comment_item", "li.comment", ".comment-area li",
      'li[class*="comment"]', 'li[class*="Comment"]',
    ].join(",");
    const containers = new Set<Element>();
    document.querySelectorAll(`${containerSelector}, [data-cid]`).forEach((node) => {
      containers.add(node.closest(containerSelector) ?? node);
    });
    const seen = new Set<string>();
    return Array.from(containers)
      .map((node) => {
        const dataCid =
          node.getAttribute("data-cid") || node.querySelector("[data-cid]")?.getAttribute("data-cid") || "";
        const buttonId =
          (node.querySelector('button[id^="commentItem"]') as HTMLButtonElement | null)?.id || "";
        const rawId = dataCid.split("-").pop() || buttonId.replace("commentItem", "");
        const text = node.textContent?.replace(/\s+/g, " ").trim() || "";
        const nickname = pickText(node, [".comment_nickname", ".CommentItemMeta .nickname", ".nick_box", ".name"]);
        const content = pickText(node, [".text_comment", ".comment_text", ".CommentItemContent", ".comment_view"]);
        return { commentId: rawId, nickname, content: content || text, text };
      })
      .filter((item) => {
        const key = item.commentId || item.text;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return /^\d+$/.test(item.commentId);
      });
  });
};

const deleteCommentViaApi = async (page: Page, commentId: string): Promise<boolean> => {
  const result = await page.evaluate(
    async ({ cafeId, articleId, commentId }) => {
      const bases = [
        `https://apis.naver.com/cafe-web/cafe-articleapi/v2.1/cafes/${cafeId}/articles/${articleId}/comments/${commentId}`,
        `https://apis.naver.com/cafe-web/cafe-articleapi/v2/cafes/${cafeId}/articles/${articleId}/comments/${commentId}`,
        `https://apis.naver.com/cafe-web/cafe-articleapi/cafes/${cafeId}/articles/${articleId}/comments/${commentId}`,
      ];
      for (const url of bases) {
        const response = await fetch(url, {
          method: "DELETE",
          credentials: "include",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
        });
        if (response.ok) return true;
      }
      return false;
    },
    { cafeId: CAFE_ID, articleId: ARTICLE_ID, commentId }
  );
  return result;
};

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const { loginAccount, getPageForAccount, closeAllContexts, acquireAccountLock, releaseAccountLock } = await import(
    "../src/shared/lib/multi-session"
  );
  const { writeCommentWithAccount } = await import("../src/shared/lib/naver-cafe-writing/comment-writer");
  const { generateComment } = await import("../src/shared/api/comment-gen-api");

  const ownerAcc = await Account.findOne({ accountId: OWNER_ACCOUNT_ID }).lean();
  if (!ownerAcc) {
    console.log("소유자 계정 없음");
    process.exit(1);
  }

  await acquireAccountLock(OWNER_ACCOUNT_ID);
  let liveComments: LiveComment[] = [];
  let articleContent = "";
  try {
    const loginResult = await loginAccount(OWNER_ACCOUNT_ID, (ownerAcc as any).password);
    if (!loginResult.success) {
      console.log(`로그인 실패: ${loginResult.error}`);
      process.exit(1);
    }
    const page = await getPageForAccount(OWNER_ACCOUNT_ID);
    page.on("dialog", async (dialog) => { try { await dialog.accept(); } catch {} });

    liveComments = await extractLiveComments(page);
    console.log(`기존 댓글 ${liveComments.length}개 발견`);

    // 새 본문 읽기 (댓글 생성용 참조 텍스트)
    await page.goto(`https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/${ARTICLE_ID}`, {
      waitUntil: "domcontentloaded", timeout: 20000,
    });
    await page.waitForTimeout(1500);
    const root = page.frames().find((f) => f.url().includes("ArticleRead") || f.name() === "cafe_main") || page;
    articleContent = await root.locator(".se-main-container, .ContentRenderer, .article_viewer").first()
      .innerText({ timeout: 5000 }).catch(() => "");
    console.log(`본문 길이: ${articleContent.length}자`);

    let deleted = 0;
    for (const comment of liveComments) {
      const ok = await deleteCommentViaApi(page, comment.commentId);
      if (ok) deleted++;
      console.log(`[삭제 ${ok ? "성공" : "실패"}] ${comment.commentId} "${comment.content.slice(0, 30)}"`);
      await page.waitForTimeout(500);
    }
    console.log(`=== 삭제 완료: ${deleted}/${liveComments.length} ===`);
  } finally {
    releaseAccountLock(OWNER_ACCOUNT_ID);
  }

  if (!articleContent) {
    console.log("본문을 못 읽어서 새 댓글 생성 중단");
    await closeAllContexts();
    await mongoose.disconnect();
    return;
  }

  // 댓글 작성용 계정 (commenter 역할, 소유자 제외)
  const commenters = await Account.find({ role: "commenter", isActive: true, accountId: { $ne: OWNER_ACCOUNT_ID } })
    .limit(NEW_COMMENT_COUNT)
    .lean();
  console.log(`댓글 작성 계정 ${commenters.length}명 확보`);

  let posted = 0;
  for (const commenter of commenters) {
    try {
      const commentText = await generateComment(CAFE_URL_SLUG);
      const account = { id: (commenter as any).accountId, password: (commenter as any).password, nickname: (commenter as any).nickname };
      const result = await writeCommentWithAccount(account, CAFE_ID, ARTICLE_ID, commentText);
      console.log(`[댓글 ${result.success ? "성공" : "실패"}] ${(commenter as any).accountId}: "${commentText.slice(0, 40)}" ${result.error || ""}`);
      if (result.success) posted++;
      await new Promise((r) => setTimeout(r, 2000));
    } catch (e: any) {
      console.log(`[댓글 오류] ${(commenter as any).accountId}: ${e.message}`);
    }
  }
  console.log(`=== 새 댓글 작성 완료: ${posted}/${commenters.length} ===`);

  await closeAllContexts();
  await mongoose.disconnect();
};

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
