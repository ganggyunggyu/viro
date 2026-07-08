export {
  getAccountList,
  addAccountAction,
  removeAccountAction,
  setMainAccountAction,
  loginAccountAction,
  autoPostWithComments,
  addCommentsToArticle,
} from './actions';

export type { AutoPostResult, AccountActionResult } from './actions';

export { likeArticleWithAccount } from '@/shared/lib/naver-cafe-writing';
export type { LikeResult } from '@/shared/lib/naver-cafe-writing';
