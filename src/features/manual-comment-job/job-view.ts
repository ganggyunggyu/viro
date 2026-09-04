import {
  DEFAULT_CAFE_COMMENT_STYLE,
  type CafeCommentStyle,
} from '@/shared/api/cafe-comment-style';
import type { IManualCommentJob, ManualCommentJobStatus } from '@/shared/models';

export interface ManualCommentJobView {
  id: string;
  articleUrl: string;
  cafeSlug: string;
  cafeId: string;
  articleId: number;
  mode: 'fixed' | 'generate' | 'agent';
  fixedComments?: string[];
  generateMinCount?: number;
  generateMaxCount?: number;
  commentStyle: CafeCommentStyle;
  delayMinMs: number;
  delayMaxMs: number;
  deleteExisting: boolean;
  status: ManualCommentJobStatus;
  errorMessage?: string;
  agentSummary?: string;
  results: Array<{
    index: number;
    accountId?: string;
    nickname?: string;
    content: string;
    success: boolean;
    error?: string;
    commentId?: string;
    postedAt?: string;
  }>;
  deleteResults: Array<{
    index: number;
    commentId: string;
    accountId?: string;
    nickname?: string;
    content: string;
    success: boolean;
    error?: string;
    deletedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const toView = (doc: IManualCommentJob): ManualCommentJobView => ({
  id: String(doc._id),
  articleUrl: doc.articleUrl,
  cafeSlug: doc.cafeSlug,
  cafeId: doc.cafeId,
  articleId: doc.articleId,
  mode: doc.mode,
  fixedComments: doc.fixedComments,
  generateMinCount: doc.generateMinCount,
  generateMaxCount: doc.generateMaxCount,
  commentStyle: doc.commentStyle ?? DEFAULT_CAFE_COMMENT_STYLE,
  delayMinMs: doc.delayMinMs,
  delayMaxMs: doc.delayMaxMs,
  deleteExisting: doc.deleteExisting ?? false,
  status: doc.status,
  errorMessage: doc.errorMessage,
  agentSummary: doc.agentSummary,
  results: (doc.results || []).map((r) => ({
    index: r.index,
    accountId: r.accountId,
    nickname: r.nickname,
    content: r.content,
    success: r.success,
    error: r.error,
    commentId: r.commentId,
    postedAt: r.postedAt ? new Date(r.postedAt).toISOString() : undefined,
  })),
  deleteResults: (doc.deleteResults || []).map((r) => ({
    index: r.index,
    commentId: r.commentId,
    accountId: r.accountId,
    nickname: r.nickname,
    content: r.content,
    success: r.success,
    error: r.error,
    deletedAt: r.deletedAt ? new Date(r.deletedAt).toISOString() : undefined,
  })),
  createdAt: new Date(doc.createdAt).toISOString(),
  updatedAt: new Date(doc.updatedAt).toISOString(),
});
