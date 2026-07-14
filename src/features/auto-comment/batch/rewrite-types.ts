import type { KeywordAssignable } from './rewrite-keyword-pool';

export type RewriteKeywordSource = 'pool' | 'custom';

export interface RewriteTask extends KeywordAssignable {
  cafeId: string;
  cafeName: string;
  service: string;
  articleId: number;
}

export interface RewriteBatchInput {
  cafeIds: string[];
  /** YYYY-MM-DD (KST 기준) */
  dateFrom: string;
  /** YYYY-MM-DD (KST 기준) */
  dateTo: string;
  keywordSource: RewriteKeywordSource;
  customKeywords?: string[];
}

export interface RewriteCafeJobRef {
  cafeId: string;
  cafeName: string;
  jobLogId: string;
  totalArticles: number;
}

export interface RewriteBatchStartResult {
  success: boolean;
  message: string;
  jobs: RewriteCafeJobRef[];
  totalArticles: number;
}

export interface RewriteArticleResult {
  articleId: number;
  keyword: string;
  success: boolean;
  error?: string;
}

export interface RewriteCafeStatus {
  cafeId: string;
  jobLogId: string;
  status: 'running' | 'completed' | 'failed';
  totalKeywords: number;
  completed: number;
  failed: number;
  results: RewriteArticleResult[];
}

export interface RewriteBatchStatusResult {
  jobs: RewriteCafeStatus[];
  overallDone: boolean;
  totalArticles: number;
  totalCompleted: number;
  totalFailed: number;
}
