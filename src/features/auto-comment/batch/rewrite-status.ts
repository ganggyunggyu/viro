import { connectDB } from '@/shared/lib/mongodb';
import { BatchJobLog } from '@/shared/models';
import type { RewriteBatchStatusResult, RewriteCafeStatus } from './rewrite-types';

export type { RewriteArticleResult, RewriteCafeStatus, RewriteBatchStatusResult } from './rewrite-types';

export const getRewriteBatchStatus = async (jobLogIds: string[]): Promise<RewriteBatchStatusResult> => {
  if (jobLogIds.length === 0) {
    return { jobs: [], overallDone: true, totalArticles: 0, totalCompleted: 0, totalFailed: 0 };
  }

  await connectDB();
  const logs = await BatchJobLog.find({ _id: { $in: jobLogIds } }).lean();

  const jobs: RewriteCafeStatus[] = logs.map((log) => ({
    cafeId: log.cafeId,
    jobLogId: log._id.toString(),
    status: log.status,
    totalKeywords: log.totalKeywords,
    completed: log.completed,
    failed: log.failed,
    results: log.results.map((result) => ({
      articleId: result.articleId ?? 0,
      keyword: result.keyword,
      success: result.success,
      error: result.error,
    })),
  }));

  const overallDone = jobs.length > 0 && jobs.every((job) => job.status !== 'running');
  const totalArticles = jobs.reduce((sum, job) => sum + job.totalKeywords, 0);
  const totalCompleted = jobs.reduce((sum, job) => sum + job.completed, 0);
  const totalFailed = jobs.reduce((sum, job) => sum + job.failed, 0);

  return { jobs, overallDone, totalArticles, totalCompleted, totalFailed };
};
