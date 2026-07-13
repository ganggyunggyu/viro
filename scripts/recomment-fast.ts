import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import fs from "fs";

const SCRATCH =
  "/private/tmp/claude-501/-Users-ganggyunggyu-Programing-cafe-bot/7fc48bb3-780d-4d48-bfbc-1be391ceec28/scratchpad";
const RUN_LOG = `${SCRATCH}/recomment-fast.log`;

interface CafeInfo {
  cafeName: string;
  cafeId: string;
  ownerAccountId: string;
}

const CAFES: Record<string, CafeInfo> = {
  "육아 돌봄수첩": { cafeName: "육아 돌봄수첩", cafeId: "31754837", ownerAccountId: "ahffkdlek12" },
  "건강 체크노트": { cafeName: "건강 체크노트", cafeId: "31754869", ownerAccountId: "ahffkekd12" },
  "건강 정보노트": { cafeName: "건강 정보노트", cafeId: "31754875", ownerAccountId: "ahsxkfldk12" },
  "생활 살림노트": { cafeName: "생활 살림노트", cafeId: "31754939", ownerAccountId: "alsrudgus531" },
  "일상 소소담": { cafeName: "일상 소소담", cafeId: "31755069", ownerAccountId: "pixelninja3" },
};

// sweep-empty-and-comments.ts가 이미 순회하며 "원고 있음"으로 확인한 59개 글 목록.
// 앞선 두 번의 시도(모바일 페이지 scrape + fetch DELETE)가 전부 실패해서 세 번째로 전면
// 재작성 — 기존 댓글 old/new 구분 없이 지금 살아있는 댓글은 전부 지우고 3개씩 새로 단다
// (사용자 명시 지시: "댓글 다 지우고 빨리 좀 작성해").
// 육아 돌봄수첩 15개는 이미 전량 완료(삭제+재작성) — 나머지 4개 카페만 남았고,
// 카페마다 계정이 달라 서로 락 경합이 없으니 순차 대신 병렬로 돌린다.
const TARGETS: Array<{ cafe: string; articleId: number }> = [
  ...[20, 19, 18, 17, 16, 15, 14, 12, 11, 10, 9, 8, 7].map((articleId) => ({ cafe: "건강 체크노트", articleId })),
  ...[20, 19, 18, 15, 14, 13, 12, 11, 10, 8].map((articleId) => ({ cafe: "건강 정보노트", articleId })),
  ...[20, 19, 18, 16, 15, 14, 12, 11, 10, 6].map((articleId) => ({ cafe: "생활 살림노트", articleId })),
  ...[18, 17, 16, 15, 14, 13, 9, 8, 7, 3, 2].map((articleId) => ({ cafe: "일상 소소담", articleId })),
];

const NEW_COMMENT_COUNT = 3;
const FAST_DELAY_MIN_MS = 3000;
const FAST_DELAY_MAX_MS = 7000;

const logLine = (msg: string): void => {
  console.log(msg);
  fs.appendFileSync(RUN_LOG, msg + "\n");
};

const fastDelay = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, FAST_DELAY_MIN_MS + Math.random() * (FAST_DELAY_MAX_MS - FAST_DELAY_MIN_MS)));

const main = async (): Promise<void> => {
  fs.writeFileSync(RUN_LOG, `# 댓글 전체 삭제 + 재작성 (시작: ${new Date().toISOString()})\n\n`);

  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const { closeAllContexts } = await import("../src/shared/lib/multi-session");
  const { listLiveComments, deleteCommentWithAccount } = await import(
    "../src/shared/lib/naver-cafe-writing/comment-deleter"
  );
  const { writeCommentWithAccount } = await import("../src/shared/lib/naver-cafe-writing/comment-writer");
  const { readCafeArticleContent } = await import("../src/shared/lib/cafe-article-reader");
  const { generateComment } = await import("../src/shared/api/comment-gen-api");

  const totals = { deleted: 0, seen: 0, posted: 0, articles: 0 };

  const byCafe = new Map<string, number[]>();
  for (const t of TARGETS) {
    const list = byCafe.get(t.cafe) || [];
    list.push(t.articleId);
    byCafe.set(t.cafe, list);
  }

  // 카페마다 계정이 다르므로 락 경합 없이 병렬로 처리한다. 카페 하나가 네트워크 순단 등으로
  // 죽어도 나머지 카페는 계속 진행되도록 카페별로 try/catch를 둔다(1차 실행이 이거 없이
  // 전체 프로세스가 통째로 죽은 적이 있었음).
  const runCafe = async (cafeName: string, articleIds: number[]): Promise<void> => {
    const cafe = CAFES[cafeName];
    if (!cafe) return;
    logLine(`\n=== [${cafeName}] ${articleIds.length}개 글 처리 시작 ===`);

    try {
      const ownerAcc = await Account.findOne({ accountId: cafe.ownerAccountId }).lean();
      if (!ownerAcc) {
        logLine(`[${cafeName}] 소유자 계정 없음, 스킵`);
        return;
      }
      const owner = { id: cafe.ownerAccountId, password: (ownerAcc as any).password };

      const commenters = await Account.find({
        role: "commenter",
        isActive: true,
        accountId: { $ne: cafe.ownerAccountId },
      })
        .limit(20)
        .lean();

      for (const articleId of articleIds) {
        totals.articles++;

        try {
          const listResult = await listLiveComments(owner, cafe.cafeId, articleId);
          if (!listResult.success) {
            logLine(`[${cafeName}][articleId=${articleId}] 댓글 조회 실패: ${listResult.error}`);
            continue;
          }
          const comments = listResult.comments || [];
          totals.seen += comments.length;

          let deleted = 0;
          for (const comment of comments) {
            const delResult = await deleteCommentWithAccount(owner, cafe.cafeId, articleId, comment.commentId);
            if (delResult.success) {
              deleted++;
            } else {
              logLine(`[${cafeName}][articleId=${articleId}] 댓글 삭제 실패 commentId=${comment.commentId}: ${delResult.error}`);
            }
          }
          totals.deleted += deleted;
          logLine(`[${cafeName}][articleId=${articleId}] 댓글 삭제 ${deleted}/${comments.length}`);

          const readResult = await readCafeArticleContent(owner, cafe.cafeId, articleId, {
            reason: `recomment_fast:${cafe.ownerAccountId}`,
          });
          if (!readResult.success || !readResult.content) {
            logLine(`[${cafeName}][articleId=${articleId}] 본문 읽기 실패: ${readResult.error}, 새 댓글 스킵`);
            continue;
          }

          const shuffled = [...(commenters as any[])].sort(() => Math.random() - 0.5).slice(0, NEW_COMMENT_COUNT);
          let posted = 0;
          for (const commenter of shuffled) {
            try {
              const commentText = await generateComment(readResult.content, commenter.personaId, commenter.nickname);
              const account = { id: commenter.accountId, password: commenter.password, nickname: commenter.nickname };
              const result = await writeCommentWithAccount(account, cafe.cafeId, articleId, commentText);
              if (result.success) posted++;
              await fastDelay();
            } catch (e: any) {
              logLine(`[${cafeName}][articleId=${articleId}] 댓글 작성 오류: ${e.message}`);
            }
          }
          totals.posted += posted;
          logLine(`[${cafeName}][articleId=${articleId}] 새 댓글 작성 ${posted}/${shuffled.length}`);
        } catch (e: any) {
          logLine(`[${cafeName}][articleId=${articleId}] 글 단위 오류(스킵하고 계속): ${e.message}`);
        }
      }
    } catch (e: any) {
      logLine(`[${cafeName}] 카페 단위 오류(다른 카페는 계속 진행): ${e.message}`);
    }
  };

  await Promise.all([...byCafe.entries()].map(([cafeName, articleIds]) => runCafe(cafeName, articleIds)));

  logLine(
    `\n=== 전체 완료: 글 ${totals.articles}개 / 댓글삭제 ${totals.deleted}/${totals.seen} / 새댓글작성 ${totals.posted} ===`
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
