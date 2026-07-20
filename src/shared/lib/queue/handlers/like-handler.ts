import { likeArticleWithAccount } from '@/shared/lib/naver-cafe-writing';
import { NaverAccount } from '@/shared/lib/account-manager';
import { createLikeJobHandler } from './like-handler-harness';

export interface LikeHandlerContext {
  account: NaverAccount;
  settings: {
    timeout: number;
  };
}

export const handleLikeJob = createLikeJobHandler({ likeArticle: likeArticleWithAccount });
