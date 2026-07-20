import type { NaverAccount } from '@/shared/lib/account-manager';
import type { ViralCommentItem } from '../types';

export interface MainCommentAssignment {
  sourceIndex: number;
  commentIndex: number;
  accountId: string;
  content: string;
}

export const selectCommenterAccounts = (
  accounts: NaverAccount[],
  writerAccountId: string,
  commenterAccountIds?: string[],
): NaverAccount[] => {
  if (commenterAccountIds === undefined) {
    return accounts.filter(({ id }) => id !== writerAccountId);
  }

  return accounts.filter(({ id }) => commenterAccountIds.includes(id) && id !== writerAccountId);
};

export const assignMainComments = (
  comments: ViralCommentItem[],
  commenterAccounts: NaverAccount[],
): MainCommentAssignment[] => {
  return comments
    .filter(({ type }) => type === 'comment')
    .map(({ index, content }, commentIndex) => ({
      sourceIndex: index,
      commentIndex,
      accountId: commenterAccounts[commentIndex % commenterAccounts.length]?.id,
      content,
    }))
    .filter((assignment): assignment is MainCommentAssignment => Boolean(assignment.accountId));
};

export const selectNormalReplyAccount = (
  commenterAccounts: NaverAccount[],
  parentAuthorId: string,
  offset: number,
): NaverAccount | undefined => {
  const available = commenterAccounts.filter(({ id }) => id !== parentAuthorId);
  if (available.length === 0) return undefined;
  return available[offset % available.length];
};
