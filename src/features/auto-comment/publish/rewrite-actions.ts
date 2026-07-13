'use server';

import { runRewriteBatchJob } from '../batch/rewrite-batch-job';
import { getRewriteBatchStatus } from '../batch/rewrite-status';
import type { RewriteBatchInput, RewriteBatchStartResult } from '../batch/rewrite-types';
import type { RewriteBatchStatusResult } from '../batch/rewrite-status';

export type { RewriteBatchInput, RewriteBatchStartResult, RewriteBatchStatusResult, RewriteKeywordSource } from '../batch/rewrite-types';

// 글 재작성 실행 — 대상 산정(카페별 라이브 글 목록 조회 + 키워드 배정)까지는 응답 전에 마치고,
// 실제 수정 작업은 next/server의 after()로 응답 이후에도 계속 실행된다.
export const runRewriteBatchAction = async (input: RewriteBatchInput): Promise<RewriteBatchStartResult> => {
  try {
    return await runRewriteBatchJob(input);
  } catch (error) {
    console.error('[REWRITE ACTION] 에러:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      jobs: [],
      totalArticles: 0,
    };
  }
};

// 진행 상황 폴링 — runRewriteBatchAction이 반환한 jobLogId 목록으로 BatchJobLog를 조회한다.
export const getRewriteBatchStatusAction = async (jobLogIds: string[]): Promise<RewriteBatchStatusResult> => {
  try {
    return await getRewriteBatchStatus(jobLogIds);
  } catch (error) {
    console.error('[REWRITE STATUS ACTION] 에러:', error);
    return { jobs: [], overallDone: true, totalArticles: 0, totalCompleted: 0, totalFailed: 0 };
  }
};
