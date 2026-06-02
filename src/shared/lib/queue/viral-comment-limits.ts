import type { ViralCommentItem } from './types';

export const MAX_VIRAL_MAIN_COMMENTS = 8;
export const MAX_VIRAL_COMMENT_JOBS = 20;

export const limitViralCommentItems = (
  comments: ViralCommentItem[],
  maxMainComments: number = MAX_VIRAL_MAIN_COMMENTS,
  maxTotalJobs: number = MAX_VIRAL_COMMENT_JOBS,
): ViralCommentItem[] => {
  const mainComments = comments
    .filter((comment) => comment.type === 'comment')
    .slice(0, maxMainComments);
  const allowedParents = new Set(mainComments.map((comment) => comment.index));
  const replies = comments.filter(
    (comment) => comment.type !== 'comment' && comment.parentIndex !== undefined && allowedParents.has(comment.parentIndex),
  );

  const limited = [...mainComments, ...replies].slice(0, maxTotalJobs);

  return limited;
};
