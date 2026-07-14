import { after } from 'next/server';
import { connectDB } from '@/shared/lib/mongodb';
import { Cafe, BatchJobLog } from '@/shared/models';
import { getAccountById } from '@/shared/config/accounts';
import { browseCafePosts } from '@/shared/lib/cafe-browser';
import { closeAllContexts } from '@/shared/lib/multi-session';
import type { NaverAccount } from '@/shared/lib/account-manager';
import { assignDiverseKeywords } from './rewrite-keyword-pool';
import { inferCafeService } from './rewrite-cafe-service';
import { processRewriteArticle } from './rewrite-article-processor';
import type {
  RewriteBatchInput,
  RewriteCafeJobRef,
  RewriteBatchStartResult,
  RewriteTask,
} from './rewrite-types';

export type {
  RewriteKeywordSource,
  RewriteTask,
  RewriteBatchInput,
  RewriteCafeJobRef,
  RewriteBatchStartResult,
} from './rewrite-types';

// scripts/rewrite-with-tete.ts의 runPool과 동일하게, 카페(=계정) 단위로 큐를 나눠 카페 큐 자체를
// 병렬 처리한다(카페 내부는 항상 순차) — 같은 계정을 서로 다른 워커가 동시에 집어 계정 락 경합으로
// 헛도는 것을 방지한다.
const REWRITE_CAFE_CONCURRENCY = 5;
const REWRITE_LIST_PAGE_SIZE = 50;
const REWRITE_INTRO_ARTICLE_ID = 1;

interface CafeTarget {
  cafeId: string;
  cafeName: string;
  ownerAccountId: string;
  service: string;
}

const isWithinDateRange = (writeDateTimestamp: number, dateFrom: string, dateTo: string): boolean => {
  if (!writeDateTimestamp) return false;
  const kst = new Date(writeDateTimestamp + 9 * 60 * 60 * 1000);
  const dateStr = kst.toISOString().slice(0, 10);
  return dateStr >= dateFrom && dateStr <= dateTo;
};

// 카페 DB의 categoryAliases는 신뢰할 수 없어(카페마다 채워진 정도가 다름) 카페 이름에서
// service(육아/건강/생활/일상)를 추론하고, ownerAccountId가 없는 카페(수동 등록 등)는 재작성
// 대상에서 제외한다 — 그 계정이 곧 글 작성자이자 수정 권한을 가진 계정이기 때문.
const resolveCafeTargets = async (cafeIds: string[]): Promise<CafeTarget[]> => {
  const cafeDocs = await Cafe.find({ cafeId: { $in: cafeIds }, isActive: true }).lean();
  const targets: CafeTarget[] = [];
  for (const doc of cafeDocs) {
    if (!doc.ownerAccountId) continue;
    targets.push({
      cafeId: doc.cafeId,
      cafeName: doc.name,
      ownerAccountId: doc.ownerAccountId,
      service: inferCafeService(doc.name),
    });
  }
  return targets;
};

interface CafeRunEntry {
  cafeId: string;
  queue: RewriteTask[];
  account: NaverAccount;
  jobLogId: string;
}

const runCafeRewriteQueue = async (entry: CafeRunEntry): Promise<void> => {
  const jobLog = await BatchJobLog.findById(entry.jobLogId);
  if (!jobLog) return;

  for (const task of entry.queue) {
    const { log, success } = await processRewriteArticle(task, entry.account);
    jobLog.results.push(log);
    if (success) jobLog.completed += 1;
    else jobLog.failed += 1;
    await jobLog.save();
  }

  jobLog.status = jobLog.failed === 0 ? 'completed' : 'failed';
  jobLog.finishedAt = new Date();
  await jobLog.save();
};

const runCafeQueuesInBackground = async (cafeRunEntries: CafeRunEntry[]): Promise<void> => {
  try {
    for (let i = 0; i < cafeRunEntries.length; i += REWRITE_CAFE_CONCURRENCY) {
      const batch = cafeRunEntries.slice(i, i + REWRITE_CAFE_CONCURRENCY);
      await Promise.all(batch.map((entry) => runCafeRewriteQueue(entry)));
    }
  } catch (error) {
    console.error('[REWRITE BATCH] 백그라운드 실행 오류:', error);
  } finally {
    await closeAllContexts();
  }
};

// 카페 다중 선택 + 날짜 범위로 실제 네이버 글 목록(browseCafePosts)을 조회해 재작성 대상을
// 산정하고, 카페별 BatchJobLog를 만든 뒤 실제 수정 작업은 next/server의 after()로 응답 이후에도
// 계속 실행되게 넘긴다. PublishedArticle DB가 아니라 라이브 네이버 목록이 진실의 원천이다.
export const runRewriteBatchJob = async (input: RewriteBatchInput): Promise<RewriteBatchStartResult> => {
  const { cafeIds, dateFrom, dateTo, keywordSource, customKeywords } = input;

  if (cafeIds.length === 0) {
    return { success: false, message: '카페를 1개 이상 선택해줘', jobs: [], totalArticles: 0 };
  }
  if (!dateFrom || !dateTo) {
    return { success: false, message: '날짜 범위를 입력해줘', jobs: [], totalArticles: 0 };
  }

  const trimmedCustomKeywords = (customKeywords ?? []).map((keyword) => keyword.trim()).filter(Boolean);
  if (keywordSource === 'custom' && trimmedCustomKeywords.length === 0) {
    return { success: false, message: '직접 입력 모드에서는 키워드를 1개 이상 입력해줘', jobs: [], totalArticles: 0 };
  }

  await connectDB();

  const targets = await resolveCafeTargets(cafeIds);
  if (targets.length === 0) {
    return { success: false, message: '선택한 카페의 관리 계정을 찾을 수 없음', jobs: [], totalArticles: 0 };
  }

  const warnings: string[] = [];
  const accountsByCafe = new Map<string, NaverAccount>();
  const tasks: RewriteTask[] = [];

  for (const target of targets) {
    const account = await getAccountById(target.ownerAccountId);
    if (!account) {
      warnings.push(`${target.cafeName}: 관리 계정(${target.ownerAccountId}) 없음`);
      continue;
    }
    accountsByCafe.set(target.cafeId, account);

    const browseResult = await browseCafePosts(account, target.cafeId, undefined, {
      page: 1,
      perPage: REWRITE_LIST_PAGE_SIZE,
    });

    if (!browseResult.success) {
      warnings.push(`${target.cafeName}: 글 목록 조회 실패 - ${browseResult.error}`);
      continue;
    }

    for (const article of browseResult.articles) {
      if (article.articleId === REWRITE_INTRO_ARTICLE_ID) continue;
      if (!isWithinDateRange(article.writeDateTimestamp, dateFrom, dateTo)) continue;
      tasks.push({
        cafeId: target.cafeId,
        cafeName: target.cafeName,
        service: target.service,
        articleId: article.articleId,
        subject: article.subject,
      });
    }
  }

  if (tasks.length === 0) {
    const reason = warnings.length > 0 ? warnings.join(' / ') : '지정한 날짜 범위에 해당하는 글이 없음';
    return { success: false, message: reason, jobs: [], totalArticles: 0 };
  }

  let finalTasks = tasks;
  if (keywordSource === 'custom') {
    finalTasks = tasks.slice(0, trimmedCustomKeywords.length);
    finalTasks.forEach((task, index) => {
      task.keyword = trimmedCustomKeywords[index];
    });
  } else {
    assignDiverseKeywords(finalTasks);
  }

  if (finalTasks.length === 0) {
    return { success: false, message: '배정 가능한 키워드가 없어 대상 글이 0개가 됨', jobs: [], totalArticles: 0 };
  }

  const byCafe = new Map<string, RewriteTask[]>();
  for (const task of finalTasks) {
    const queue = byCafe.get(task.cafeId) ?? [];
    queue.push(task);
    byCafe.set(task.cafeId, queue);
  }

  const jobs: RewriteCafeJobRef[] = [];
  const cafeRunEntries: CafeRunEntry[] = [];

  for (const [cafeId, queue] of byCafe) {
    const target = targets.find((t) => t.cafeId === cafeId);
    const account = accountsByCafe.get(cafeId);
    if (!target || !account) continue;

    const jobLog = await BatchJobLog.create({
      jobType: 'rewrite',
      cafeId,
      keywords: queue.map((task) => task.keyword ?? ''),
      totalKeywords: queue.length,
      results: [],
      status: 'running',
      startedAt: new Date(),
    });

    const jobLogId = jobLog._id.toString();
    jobs.push({ cafeId, cafeName: target.cafeName, jobLogId, totalArticles: queue.length });
    cafeRunEntries.push({ cafeId, queue, account, jobLogId });
  }

  if (jobs.length === 0) {
    return { success: false, message: '재작성 큐를 만들지 못함', jobs: [], totalArticles: 0 };
  }

  // 응답을 기다리게 하지 않고, 실제 수정 작업은 응답 이후에도 계속 실행되게 넘긴다.
  // 클라이언트는 반환된 jobLogId로 BatchJobLog를 폴링해 진행률을 확인한다.
  after(() => runCafeQueuesInBackground(cafeRunEntries));

  const totalArticles = finalTasks.length;
  const skippedNote = warnings.length > 0 ? ` (스킵: ${warnings.join(', ')})` : '';
  return {
    success: true,
    message: `${jobs.length}개 카페, 총 ${totalArticles}개 글 재작성을 시작함${skippedNote}`,
    jobs,
    totalArticles,
  };
};
