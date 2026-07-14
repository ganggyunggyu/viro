import { deleteCommentWithAccount, listLiveComments, type LiveComment } from './comment-deleter';
import type { NaverAccount } from '@/shared/lib/account-manager';

export interface ReplaceLiveCommentsResult {
  liveComments: LiveComment[];
  deletedCommentIds: string[];
  failures: Array<{ commentId: string; error: string }>;
}

/**
 * 실제 네이버 댓글 목록을 기준으로 현재 사용자가 소유한 댓글을 제거한다.
 * DB 댓글 기록은 삭제 대상 판정에 사용하지 않으며, 계정별 삭제 권한으로만 판정한다.
 */
export const deleteAllOwnedLiveComments = async (
  reader: NaverAccount,
  deleteAccounts: NaverAccount[],
  cafeId: string,
  articleId: number,
): Promise<ReplaceLiveCommentsResult> => {
  const listed = await listLiveComments(reader, cafeId, articleId);
  if (!listed.success) throw new Error(listed.error || '라이브 댓글 목록을 읽지 못함');

  const liveComments = listed.comments || [];
  const deletedCommentIds: string[] = [];
  const failures: Array<{ commentId: string; error: string }> = [];

  for (const comment of liveComments) {
    let deleted = false;
    let lastError = '삭제 가능한 계정을 찾지 못함';
    for (const account of deleteAccounts) {
      const result = await deleteCommentWithAccount(account, cafeId, articleId, comment.commentId);
      if (result.success) {
        deleted = true;
        deletedCommentIds.push(comment.commentId);
        break;
      }
      lastError = result.error || lastError;
    }
    if (!deleted) failures.push({ commentId: comment.commentId, error: lastError });
  }

  return { liveComments, deletedCommentIds, failures };
};
