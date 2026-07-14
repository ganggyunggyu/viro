import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

// 큐 FIFO(createdAt순) 뒤에 41개(각 ~58분)가 밀려있어 healthhhh/99 (댓글 5개, ~25분 짜리)가
// 순서상 맨 뒤에서 대기하게 된 문제. run-manual-comment-worker.ts의 processJob() 'fixed' 모드
// 경로를 그대로 재현해서 이 작업 하나만 큐를 건너뛰고 즉시 처리한다. 나머지 41개 순서는 그대로 둔다.

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const randomDelay = (min: number, max: number): number =>
  Math.floor(min + Math.random() * Math.max(0, max - min));
const normalizeName = (v: string): string => (v || "").replace(/\([^)]*\)/g, "").replace(/\s+/g, "").trim();

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account, ManualCommentJob, PublishedArticle } = await import("../src/shared/models");
  const { hasCommented, addCommentToArticle } = await import("../src/shared/models/published-article");
  const { writeCommentWithAccount } = await import("../src/shared/lib/naver-cafe-writing/comment-writer");
  const { readCafeArticleContent } = await import("../src/shared/lib/cafe-article-reader");
  const { closeAllContexts } = await import("../src/shared/lib/multi-session");

  const job = await ManualCommentJob.findOneAndUpdate(
    { cafeSlug: "healthhhh", articleId: 99, status: "pending" },
    { $set: { status: "running", claimedAt: new Date(), claimedBy: "priority-run" } },
    { new: true }
  );

  if (!job) {
    console.log("작업이 이미 처리 중이거나 없음 — 중단");
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`[JOB ${job._id}] 우선 처리 시작: ${job.cafeSlug}/${job.articleId}`);

  const accountsForRead = await Account.find({
    userId: job.userId,
    isActive: true,
    role: "commenter",
    excludeFromAutoComment: { $ne: true },
  })
    .select("accountId password nickname")
    .limit(3)
    .lean();

  let articleTitle = "";
  let articleBody = "";
  let ownerNickname = "";
  let readError = "";

  for (const reader of accountsForRead as any[]) {
    const result = await readCafeArticleContent(
      { id: reader.accountId, password: reader.password, nickname: reader.nickname || reader.accountId },
      job.cafeId,
      job.articleId,
      { reason: `manual_comment_job_read:${reader.accountId}` }
    );
    if (result.success && result.content) {
      articleTitle = result.title || "";
      articleBody = result.content;
      ownerNickname = result.authorNickname || "";
      break;
    }
    readError = result.error || "본문 읽기 실패";
  }

  if (!articleBody) {
    await ManualCommentJob.updateOne(
      { _id: job._id },
      { $set: { status: "failed", errorMessage: `본문 읽기 실패: ${readError}` } }
    );
    console.error(`[JOB ${job._id}] 실패: 본문 읽기 실패 (${readError})`);
    await closeAllContexts();
    await mongoose.disconnect();
    process.exit(1);
  }

  const texts: string[] = job.fixedComments || [];
  if (texts.length === 0) {
    await ManualCommentJob.updateOne({ _id: job._id }, { $set: { status: "failed", errorMessage: "고정 댓글 없음" } });
    console.error(`[JOB ${job._id}] 실패: fixedComments 비어있음`);
    await closeAllContexts();
    await mongoose.disconnect();
    process.exit(1);
  }

  const commenterAccounts = await Account.find({
    userId: job.userId,
    isActive: true,
    role: "commenter",
    excludeFromAutoComment: { $ne: true },
  })
    .select("accountId password nickname")
    .lean();

  const existing = await PublishedArticle.findOne({ cafeId: job.cafeId, articleId: job.articleId }, { comments: 1 }).lean();
  const alreadyCommented = new Set(
    ((existing as any)?.comments || []).map((c: any) => c.accountId).filter(Boolean)
  );

  const allDocs = await PublishedArticle.find({}, { comments: 1 }).lean();
  const lastUsedAt = new Map<string, number>();
  for (const doc of allDocs as any[]) {
    for (const c of doc.comments || []) {
      if (!c.accountId || !c.createdAt) continue;
      const ts = new Date(c.createdAt).getTime();
      const prev = lastUsedAt.get(c.accountId) || 0;
      if (ts > prev) lastUsedAt.set(c.accountId, ts);
    }
  }

  const eligible = (commenterAccounts as any[]).filter(
    (a) =>
      normalizeName(a.nickname || a.accountId) !== normalizeName(ownerNickname) &&
      !alreadyCommented.has(a.accountId)
  );
  const pool = eligible.sort(
    (a, b) => (lastUsedAt.get(a.accountId) || 0) - (lastUsedAt.get(b.accountId) || 0)
  );

  console.log(`[JOB ${job._id}] 계정 풀 ${pool.length}개, 댓글 ${texts.length}개, 소유자 닉네임="${ownerNickname}"`);

  let accountIdx = 0;
  let successCount = 0;

  for (let commentIdx = 0; commentIdx < texts.length; commentIdx += 1) {
    const content = texts[commentIdx];
    let posted = false;

    while (!posted && accountIdx < pool.length) {
      const account = pool[accountIdx];
      accountIdx += 1;

      const already = await hasCommented(job.cafeId, job.articleId, account.accountId, "comment");
      if (already) continue;

      const result = await writeCommentWithAccount(
        { id: account.accountId, password: account.password, nickname: account.nickname || account.accountId },
        job.cafeId,
        job.articleId,
        content
      );

      if (!result.success) {
        console.error(`[JOB ${job._id}] FAIL ${account.accountId}: ${result.error}`);
        await ManualCommentJob.updateOne(
          { _id: job._id },
          {
            $push: {
              results: {
                index: commentIdx,
                accountId: account.accountId,
                nickname: account.nickname,
                content,
                success: false,
                error: result.error,
                postedAt: new Date(),
              },
            },
          }
        );
        await sleep(15_000);
        continue;
      }

      await addCommentToArticle(job.cafeId, job.articleId, {
        accountId: account.accountId,
        nickname: account.nickname || account.accountId,
        content,
        type: "comment",
        commentId: result.commentId,
      });
      await ManualCommentJob.updateOne(
        { _id: job._id },
        {
          $push: {
            results: {
              index: commentIdx,
              accountId: account.accountId,
              nickname: account.nickname,
              content,
              success: true,
              commentId: result.commentId,
              postedAt: new Date(),
            },
          },
        }
      );
      console.log(`[JOB ${job._id}] SUCCESS ${successCount + 1}/${texts.length} ${account.accountId}`);
      successCount += 1;
      posted = true;

      if (commentIdx < texts.length - 1) {
        const delayMs = randomDelay(job.delayMinMs, job.delayMaxMs);
        console.log(`[JOB ${job._id}] 다음 댓글까지 ${Math.round(delayMs / 1000)}초 대기`);
        await sleep(delayMs);
      }
    }
  }

  await ManualCommentJob.updateOne(
    { _id: job._id },
    { $set: { status: successCount > 0 ? "done" : "failed", errorMessage: successCount === 0 ? "모든 계정 시도 실패" : undefined } }
  );
  console.log(`[JOB ${job._id}] 종료: ${successCount}/${texts.length} 성공`);

  await closeAllContexts();
  await mongoose.disconnect();
  process.exit(0);
};

main().catch(async (e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
