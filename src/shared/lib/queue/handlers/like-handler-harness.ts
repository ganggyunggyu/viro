import type { NaverAccount } from '@/shared/lib/account-manager';
import type { LikeResult } from '@/shared/lib/naver-cafe-writing';
import type { JobResult, LikeJobData } from '../types';

export interface LikeJobHandlerContext {
  account: NaverAccount;
  settings: { timeout: number };
}

export interface LikeJobHandlerDeps {
  likeArticle: (
    account: NaverAccount,
    cafeId: string,
    articleId: number,
  ) => Promise<LikeResult>;
  log?: (message: string) => void;
}

export const createLikeJobHandler = ({ likeArticle, log = console.log }: LikeJobHandlerDeps) => {
  return async (data: LikeJobData, ctx: LikeJobHandlerContext): Promise<JobResult> => {
    const { account, settings } = ctx;
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('타임아웃')), settings.timeout);
    });
    const result = await Promise.race([
      likeArticle(account, data.cafeId, data.articleId),
      timeout,
    ]);

    if (!result.success && result.error?.startsWith('ARTICLE_NOT_READY:')) {
      log(`[WORKER] 좋아요 실패 (글 미준비): ${data.articleId}`);
      return { success: false, error: result.error };
    }

    if (!result.success) {
      throw new Error(result.error || '좋아요 실패');
    }

    return { success: true };
  };
};
