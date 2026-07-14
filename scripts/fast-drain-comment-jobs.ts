import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import { User, ManualCommentJob, PublishedArticle, addCommentToArticle, hasCommented, type IManualCommentJob } from '../src/shared/models';
import { getCommenterAccounts } from '../src/shared/config/accounts';
import type { NaverAccount } from '../src/shared/lib/account-manager';
import { readCafeArticleContent } from '../src/shared/lib/cafe-article-reader';
import { generateCafeCommentBatch } from '../src/shared/api/cafe-comment-batch-api';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const TARGET_PER_ARTICLE = Number(process.env.TARGET_PER_ARTICLE) || 6;
const CONCURRENCY = Number(process.env.CONCURRENCY) || 6;
const COMMENT_DELAY_MS = Number(process.env.COMMENT_DELAY_MS) || 4000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (s?: string) => (s || '').replace(/\([^)]*\)/g, '').replace(/\s+/g, '').trim();

let accOffset = 0;
let readerOffset = 0;
let doneJobs = 0;
let okComments = 0;
let failComments = 0;

const appendResult = async (jobId: mongoose.Types.ObjectId, r: any) =>
  ManualCommentJob.updateOne({ _id: jobId }, { $push: { results: { ...r, postedAt: new Date() } } });

const processJob = async (
  job: IManualCommentJob,
  pool: NaverAccount[],
): Promise<void> => {
  const jobId = job._id as mongoose.Types.ObjectId;
  const existingOk = (job.results || []).filter((r: any) => r.success).length;
  const needed = TARGET_PER_ARTICLE - existingOk;
  const tag = `${job.cafeSlug}/${job.articleId}`;

  if (needed <= 0) {
    await ManualCommentJob.updateOne({ _id: jobId }, { $set: { status: 'done' } });
    doneJobs += 1;
    console.log(`[SKIP] ${tag} 이미 ${existingOk}개 (충분)`);
    return;
  }

  // 1) 본문 읽기 (리더 계정 회전 — 앞쪽 계정 락 경합 방지)
  let title = job.cafeSlug;
  let body = '';
  let author = '';
  const rOff = readerOffset; readerOffset += 2;
  const readers = [pool[rOff % pool.length], pool[(rOff + 1) % pool.length]];
  for (const reader of readers) {
    try {
      const r = await readCafeArticleContent(
        { id: reader.id, password: reader.password, nickname: reader.nickname || reader.id },
        job.cafeId, job.articleId, { reason: 'fast_drain_read' },
      );
      if (r.success && r.content) {
        title = r.title || title;
        body = r.content;
        author = r.authorNickname || '';
        break;
      }
    } catch {}
  }

  // 2) 댓글 생성
  let texts: string[] = [];
  for (let attempt = 0; attempt < 2 && texts.length < needed; attempt += 1) {
    try {
      const batch = await generateCafeCommentBatch({
        title, body: body || title, keyword: title, category: job.cafeSlug,
        exactCount: needed, model: 'deepseek-v4-flash',
      });
      texts = (batch.comments || []).map((c) => c.content).filter(Boolean);
    } catch (e) {
      console.log(`[GEN-ERR] ${tag}: ${e instanceof Error ? e.message : e}`);
    }
  }
  if (texts.length === 0) {
    await ManualCommentJob.updateOne({ _id: jobId }, { $set: { status: 'failed', errorMessage: '댓글 생성 실패' } });
    console.log(`[FAIL] ${tag} 생성 실패`);
    return;
  }

  // 3) 대상 계정 선정 (이미 단 계정 + 작성자 제외, 전역 회전으로 분산)
  const existing = await PublishedArticle.findOne({ cafeId: job.cafeId, articleId: job.articleId }, { comments: 1 }).lean<{ comments?: Array<{ accountId?: string }> } | null>();
  const already = new Set((existing?.comments || []).map((c) => c.accountId).filter(Boolean) as string[]);
  const eligible = pool.filter((a) => !already.has(a.id) && norm(a.nickname) !== norm(author));

  const take = Math.min(needed, texts.length, eligible.length);
  const off = accOffset; accOffset += take;
  const chosen: NaverAccount[] = [];
  for (let i = 0; i < eligible.length && chosen.length < take; i += 1) {
    chosen.push(eligible[(off + i) % eligible.length]);
  }

  // 4) 게시
  let success = 0;
  for (let i = 0; i < chosen.length; i += 1) {
    const acc = chosen[i];
    const content = texts[i];
    try {
      if (await hasCommented(job.cafeId, job.articleId, acc.id, 'comment')) continue;
      const res = await writeCommentWithAccount(
        { id: acc.id, password: acc.password, nickname: acc.nickname || acc.id },
        job.cafeId, job.articleId, content,
      );
      if (res.success) {
        await addCommentToArticle(job.cafeId, job.articleId, {
          accountId: acc.id, nickname: acc.nickname || acc.id, content, type: 'comment', commentId: res.commentId,
        });
        await appendResult(jobId, { index: existingOk + i, accountId: acc.id, nickname: acc.nickname, content, success: true, commentId: res.commentId });
        success += 1; okComments += 1;
      } else {
        await appendResult(jobId, { index: existingOk + i, accountId: acc.id, nickname: acc.nickname, content, success: false, error: res.error });
        failComments += 1;
      }
    } catch (e) {
      failComments += 1;
      await appendResult(jobId, { index: existingOk + i, accountId: acc.id, content, success: false, error: e instanceof Error ? e.message : String(e) });
    }
    await sleep(COMMENT_DELAY_MS);
  }

  const total = existingOk + success;
  await ManualCommentJob.updateOne({ _id: jobId }, { $set: { status: total > 0 ? 'done' : 'failed', errorMessage: total > 0 ? undefined : '모든 게시 실패' } });
  doneJobs += 1;
  console.log(`[DONE] ${tag} +${success} (누적 ${total}/${TARGET_PER_ARTICLE}) | 진행 job=${doneJobs} 댓글ok=${okComments} fail=${failComments}`);
};

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10_000 });
  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error('user not found');
  const userId = (user as any).userId;

  const pool = (await getCommenterAccounts(userId)).filter((a) => !a.excludeFromAutoComment);
  console.log(`[FAST-DRAIN] 커밋터 ${pool.length}명 / 글당 ${TARGET_PER_ARTICLE}개 / 동시 ${CONCURRENCY}레인 / 댓글간 ${COMMENT_DELAY_MS}ms`);

  // running(멈춘 pm2가 잡아둔 것 포함) + pending 모두 대상
  const jobs = await ManualCommentJob.find(
    { userId, status: { $in: ['pending', 'running'] }, mode: 'generate' },
  ).sort({ createdAt: 1 }).lean<IManualCommentJob[]>();
  console.log(`[FAST-DRAIN] 처리 대상 job: ${jobs.length}개\n`);

  let idx = 0;
  const lane = async (laneId: number): Promise<void> => {
    while (true) {
      const job = jobs[idx];
      idx += 1;
      if (!job) return;
      try {
        await processJob(job, pool);
      } catch (e) {
        console.log(`[LANE${laneId}-ERR] ${job.cafeSlug}/${job.articleId}: ${e instanceof Error ? e.message : e}`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => lane(i + 1)));

  console.log(`\n[FAST-DRAIN 완료] job ${doneJobs}개, 성공댓글 ${okComments}개, 실패 ${failComments}개`);
};

main()
  .catch((e) => { console.error('fast-drain failed:', e); process.exitCode = 1; })
  .finally(async () => {
    try { await closeAllContexts(); } catch {}
    try { await mongoose.disconnect(); } catch {}
    process.exit(process.exitCode || 0);
  });
