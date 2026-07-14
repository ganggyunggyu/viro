import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import fs from "fs";
import type { Page, Frame } from "playwright";

type Root = Page | Frame;

const SCRATCH =
  "/private/tmp/claude-501/-Users-ganggyunggyu-Programing-cafe-bot/7fc48bb3-780d-4d48-bfbc-1be391ceec28/scratchpad";
const EMPTY_LOG = `${SCRATCH}/empty-articles.md`;
const RUN_LOG = `${SCRATCH}/sweep-progress.log`;

interface CafeInfo {
  cafeName: string;
  cafeId: string;
  cafeUrl: string;
  ownerAccountId: string;
}

// rewrite-with-tete.ts와 동일한 5개 카페 + 실제 재작성이 사용 중인 계정(ownerAccountId) 그대로 사용
const CAFES: CafeInfo[] = [
  { cafeName: "육아 돌봄수첩", cafeId: "31754837", cafeUrl: "babycare702", ownerAccountId: "ahffkdlek12" },
  { cafeName: "건강 체크노트", cafeId: "31754869", cafeUrl: "healthcheck702", ownerAccountId: "ahffkekd12" },
  { cafeName: "건강 정보노트", cafeId: "31754875", cafeUrl: "healthinfo702", ownerAccountId: "ahsxkfldk12" },
  { cafeName: "생활 살림노트", cafeId: "31754939", cafeUrl: "livingnote702", ownerAccountId: "alsrudgus531" },
  { cafeName: "일상 소소담", cafeId: "31755069", cafeUrl: "dailychat702", ownerAccountId: "pixelninja3" },
];

const TARGET_PUBLISH_DATES = new Set(["2026-07-11", "2026-07-12"]);
const isTargetPublishDate = (writeDateTimestamp: number): boolean => {
  if (!writeDateTimestamp) return false;
  const kst = new Date(writeDateTimestamp + 9 * 60 * 60 * 1000);
  return TARGET_PUBLISH_DATES.has(kst.toISOString().slice(0, 10));
};

// 본문이 실질적으로 비어있는지 판정하는 최소 길이 — 실제 재작성 원고는 항상
// 1500자 이상이라 100자 미만이면 원고 미반영(재작성 실패/미처리)으로 본다.
const EMPTY_BODY_THRESHOLD = 100;

const logLine = (msg: string): void => {
  console.log(msg);
  fs.appendFileSync(RUN_LOG, msg + "\n");
};

const getCommentRoot = async (page: Page): Promise<Root> => {
  try {
    await page.waitForSelector("iframe#cafe_main", { timeout: 3000 });
    const frame = await (await page.$("iframe#cafe_main"))?.contentFrame();
    return frame ?? page;
  } catch {
    return page;
  }
};

interface LiveComment {
  commentId: string;
  content: string;
  text: string;
}

const extractLiveComments = async (page: Page, cafeUrl: string, articleId: number): Promise<LiveComment[]> => {
  await page.goto(`https://m.cafe.naver.com/ca-fe/web/cafes/${cafeUrl}/articles/${articleId}?useCafeId=false`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(2000);
  const root = await getCommentRoot(page);
  for (let i = 0; i < 4; i++) {
    try {
      await root.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await root.waitForTimeout(400);
    } catch {}
  }
  return root.evaluate(() => {
    const pickText = (node: Element, selectors: string[]): string => {
      for (const selector of selectors) {
        const text = node.querySelector(selector)?.textContent?.trim();
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
        const buttonId = (node.querySelector('button[id^="commentItem"]') as HTMLButtonElement | null)?.id || "";
        const rawId = dataCid.split("-").pop() || buttonId.replace("commentItem", "");
        const text = node.textContent?.replace(/\s+/g, " ").trim() || "";
        const content = pickText(node, [".text_comment", ".comment_text", ".CommentItemContent", ".comment_view"]);
        return { commentId: rawId, content: content || text, text };
      })
      .filter((item) => {
        const key = item.commentId || item.text;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return /^\d+$/.test(item.commentId);
      });
  });
};

const deleteCommentViaApi = async (page: Page, cafeId: string, articleId: number, commentId: string): Promise<boolean> => {
  return page.evaluate(
    async ({ cafeId, articleId, commentId }) => {
      const bases = [
        `https://apis.naver.com/cafe-web/cafe-articleapi/v2.1/cafes/${cafeId}/articles/${articleId}/comments/${commentId}`,
        `https://apis.naver.com/cafe-web/cafe-articleapi/v2/cafes/${cafeId}/articles/${articleId}/comments/${commentId}`,
        `https://apis.naver.com/cafe-web/cafe-articleapi/cafes/${cafeId}/articles/${articleId}/comments/${commentId}`,
      ];
      for (const url of bases) {
        const res = await fetch(url, {
          method: "DELETE",
          credentials: "include",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
        });
        if (res.ok) return true;
      }
      return false;
    },
    { cafeId, articleId, commentId }
  );
};

const readBodyLength = async (page: Page, cafeId: string, articleId: number): Promise<number> => {
  await page.goto(`https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}?boardtype=L`, {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  await page.waitForTimeout(1200);
  const root = page.frames().find((f) => f.url().includes("ArticleRead") || f.name() === "cafe_main") || page;
  const text = await root
    .locator(".se-main-container, .ContentRenderer, .article_viewer")
    .first()
    .innerText({ timeout: 5000 })
    .catch(() => "");
  return text.trim().length;
};

const main = async (): Promise<void> => {
  fs.writeFileSync(EMPTY_LOG, `# 원고 없는 글 (7/11~7/12 대상, 스윕 시각: ${new Date().toISOString()})\n\n`);
  fs.writeFileSync(RUN_LOG, "");

  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const { browseCafePosts } = await import("../src/shared/lib/cafe-browser");
  const { loginAccount, getPageForAccount, closeAllContexts, closeContextForAccount, acquireAccountLock, releaseAccountLock } =
    await import("../src/shared/lib/multi-session");

  let totalEmpty = 0;
  let totalHasBody = 0;
  let totalCommentsDeleted = 0;
  let totalCommentsSeen = 0;

  for (const cafe of CAFES) {
    logLine(`\n=== [${cafe.cafeName}] 순회 시작 ===`);
    const acc = await Account.findOne({ accountId: cafe.ownerAccountId }).lean();
    if (!acc) {
      logLine(`[${cafe.cafeName}] 계정(${cafe.ownerAccountId}) DB에 없음, 스킵`);
      continue;
    }

    const listResult = await browseCafePosts(
      { id: cafe.ownerAccountId, password: (acc as any).password },
      cafe.cafeId,
      undefined,
      { page: 1, perPage: 50 }
    );
    if (!listResult.success) {
      logLine(`[${cafe.cafeName}] 목록 조회 실패: ${listResult.error}`);
      continue;
    }

    const targets = (listResult.articles as any[]).filter(
      (a) => a.articleId !== 1 && isTargetPublishDate(a.writeDateTimestamp)
    );
    logLine(`[${cafe.cafeName}] 대상 글 ${targets.length}개`);

    await acquireAccountLock(cafe.ownerAccountId);
    try {
      const loginResult = await loginAccount(cafe.ownerAccountId, (acc as any).password);
      if (!loginResult.success) {
        logLine(`[${cafe.cafeName}] 로그인 실패: ${loginResult.error}`);
        continue;
      }
      const page = await getPageForAccount(cafe.ownerAccountId);
      page.on("dialog", async (dialog) => {
        try {
          await dialog.accept();
        } catch {}
      });

      for (const article of targets) {
        const articleId = article.articleId as number;
        let bodyLen = 0;
        try {
          bodyLen = await readBodyLength(page, cafe.cafeId, articleId);
        } catch (e: any) {
          logLine(`[${cafe.cafeName}][articleId=${articleId}] 본문 읽기 오류: ${e.message}`);
          continue;
        }

        const link = `https://cafe.naver.com/ca-fe/cafes/${cafe.cafeId}/articles/${articleId}`;

        if (bodyLen < EMPTY_BODY_THRESHOLD) {
          totalEmpty++;
          logLine(`[${cafe.cafeName}][articleId=${articleId}] 원고 없음 (본문 ${bodyLen}자) → ${link}`);
          fs.appendFileSync(
            EMPTY_LOG,
            `- [${cafe.cafeName}] articleId=${articleId} "${article.subject}" (본문 ${bodyLen}자) — ${link}\n`
          );
          continue;
        }

        totalHasBody++;
        logLine(`[${cafe.cafeName}][articleId=${articleId}] 원고 있음 (본문 ${bodyLen}자), 기존 댓글 정리 시작`);

        let comments: LiveComment[] = [];
        try {
          comments = await extractLiveComments(page, cafe.cafeUrl, articleId);
        } catch (e: any) {
          logLine(`[${cafe.cafeName}][articleId=${articleId}] 댓글 조회 오류: ${e.message}`);
        }
        totalCommentsSeen += comments.length;

        // 재작성 완료(본문 교체)된 글의 기존 댓글은 전부 옛 주제 기준이라 새 원고와
        // 무관 — 키워드/내용 불일치 판정 없이 전량 삭제(사용자 명시 지시: "일단 전부 지워버려")
        let deleted = 0;
        for (const comment of comments) {
          try {
            const ok = await deleteCommentViaApi(page, cafe.cafeId, articleId, comment.commentId);
            if (ok) deleted++;
            await page.waitForTimeout(300);
          } catch {}
        }
        totalCommentsDeleted += deleted;
        if (comments.length > 0) {
          logLine(`[${cafe.cafeName}][articleId=${articleId}] 댓글 삭제 ${deleted}/${comments.length}`);
        }
      }
    } finally {
      releaseAccountLock(cafe.ownerAccountId);
      try {
        await closeContextForAccount(cafe.ownerAccountId);
      } catch {}
    }
  }

  logLine(
    `\n=== 스윕 완료: 원고없음 ${totalEmpty} / 원고있음(댓글정리대상) ${totalHasBody} / 댓글삭제 ${totalCommentsDeleted}/${totalCommentsSeen} ===`
  );

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error("ERROR:", e.message);
    try {
      await closeAllContexts();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
