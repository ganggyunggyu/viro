import type { NaverAccount } from '@/shared/lib/account-manager';
import { generateComment, generateReply, generateAuthorReply } from '@/shared/api/comment-gen-api';
import { writeCommentWithAccount, writeReplyWithAccount } from '@/shared/lib/naver-cafe-writing';
import { type CommentResult, type ReplyResult } from './types';
import { getRandomCommentCount } from './random';
import { buildReplyTasks } from './keyword-processor-utils';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface PostCommentsParams {
  cafeId: string;
  articleId: number;
  commenterAccounts: NaverAccount[];
  postContext: string;
  betweenCommentsDelayMs: number;
}

export interface PostCommentsOutcome {
  commentResults: CommentResult[];
  commentTexts: string[];
  commentAuthors: Array<{ id: string; nickname: string }>;
  commentIds: Array<string | undefined>;
}

export const postComments = async ({
  cafeId,
  articleId,
  commenterAccounts,
  postContext,
  betweenCommentsDelayMs,
}: PostCommentsParams): Promise<PostCommentsOutcome> => {
  const commentResults: CommentResult[] = [];
  const commentTexts: string[] = [];
  const commentAuthors: Array<{ id: string; nickname: string }> = [];
  const commentIds: Array<string | undefined> = [];
  const commentCount = getRandomCommentCount();

  for (let j = 0; j < commentCount; j++) {
    const commenter = commenterAccounts[j % commenterAccounts.length];

    let commentText: string;
    try {
      commentText = await generateComment(postContext);
    } catch {
      commentText = '좋은 정보 감사합니다!';
    }

    const result = await writeCommentWithAccount(commenter, cafeId, articleId, commentText);

    commentResults.push({
      accountId: result.accountId,
      success: result.success,
      commentIndex: j,
      error: result.error,
    });

    if (result.success) {
      commentTexts.push(commentText);
      commentAuthors.push({ id: commenter.id, nickname: commenter.nickname || commenter.id });
      commentIds.push(result.commentId);
    }

    if (j < commentCount - 1) {
      await sleep(betweenCommentsDelayMs);
    }
  }

  return { commentResults, commentTexts, commentAuthors, commentIds };
};

export interface PostRepliesParams {
  cafeId: string;
  articleId: number;
  writerAccount: NaverAccount;
  commenterAccounts: NaverAccount[];
  postContext: string;
  betweenRepliesDelayMs: number;
  comments: PostCommentsOutcome;
}

export const postReplies = async ({
  cafeId,
  articleId,
  writerAccount,
  commenterAccounts,
  postContext,
  betweenRepliesDelayMs,
  comments: { commentResults, commentTexts, commentAuthors, commentIds },
}: PostRepliesParams): Promise<ReplyResult[]> => {
  const replyResults: ReplyResult[] = [];
  const successfulComments = commentResults.filter((c) => c.success);

  if (successfulComments.length < 2 || commentTexts.length < 2) {
    return replyResults;
  }

  const replyTasks = buildReplyTasks(writerAccount, commenterAccounts, commentAuthors, commentTexts);
  const writerNickname = writerAccount.nickname || writerAccount.id;

  for (let j = 0; j < replyTasks.length; j++) {
    const task = replyTasks[j];
    const parentComment = commentTexts[task.targetCommentIndex];
    const parentAuthor = commentAuthors[task.targetCommentIndex];
    const commenterNickname = task.account.nickname || task.account.id;

    let replyText: string;
    try {
      if (task.isAuthor) {
        replyText = await generateAuthorReply(postContext, parentComment, undefined, parentAuthor.nickname, writerNickname);
      } else {
        replyText = await generateReply(postContext, parentComment, undefined, writerNickname, parentAuthor.nickname, commenterNickname);
      }
    } catch {
      replyText = task.isAuthor ? '댓글 감사합니다!' : '저도 그렇게 생각해요!';
    }

    const result = await writeReplyWithAccount(
      task.account,
      cafeId,
      articleId,
      replyText,
      task.targetCommentIndex,
      {
        parentCommentId: commentIds[task.targetCommentIndex],
        parentComment,
        parentNickname: parentAuthor.nickname,
      }
    );

    replyResults.push({
      accountId: result.accountId,
      success: result.success,
      targetCommentIndex: task.targetCommentIndex,
      isAuthor: task.isAuthor,
      error: result.error,
    });

    console.log(
      `[BATCH] 대댓글 ${j + 1}/${replyTasks.length}: ${task.isAuthor ? '글쓴이' : '일반'} (${task.account.id})`
    );

    if (j < replyTasks.length - 1) {
      await sleep(betweenRepliesDelayMs);
    }
  }

  return replyResults;
};
