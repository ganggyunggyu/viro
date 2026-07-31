import { sleep } from '@ganggyunggyu/shared';
import type { NaverAccount } from '@/shared/lib/account-manager';
import { generateReply, generateAuthorReply } from '@/shared/api/comment-gen-api';
import { CAFE_COMMENT_COUNT, generateCafeCommentBatch } from '@/shared/api/cafe-comment-batch-api';
import { writeCommentWithAccount, writeReplyWithAccount } from '@/shared/lib/naver-cafe-writing';
import { type CommentResult, type ReplyResult } from './types';
import { buildReplyTasks } from './keyword-processor-utils';

export interface PostCommentsParams {
  cafeId: string;
  articleId: number;
  commenterAccounts: NaverAccount[];
  keyword: string;
  articleTitle: string;
  articleBody: string;
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
  keyword,
  articleTitle,
  articleBody,
  betweenCommentsDelayMs,
}: PostCommentsParams): Promise<PostCommentsOutcome> => {
  const commentResults: CommentResult[] = [];
  const commentTexts: string[] = [];
  const commentAuthors: Array<{ id: string; nickname: string }> = [];
  const commentIds: Array<string | undefined> = [];

  // 본문을 읽고 그 내용을 다시 풀어 설명하는 댓글이므로, 글 단위로 한 번에 8개를 받아 쓴다.
  const batch = await generateCafeCommentBatch({
    keyword,
    title: articleTitle,
    body: articleBody,
  });
  const texts = batch.comments.map(({ content }) => content).slice(0, CAFE_COMMENT_COUNT);

  if (batch.warnings.length > 0) {
    console.warn(`[BATCH] 댓글 생성 경고: ${batch.warnings.join(', ')}`);
  }

  const commentCount = texts.length;

  for (let j = 0; j < commentCount; j++) {
    const commenter = commenterAccounts[j % commenterAccounts.length];
    const commentText = texts[j];

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
  keyword: string;
  betweenRepliesDelayMs: number;
  comments: PostCommentsOutcome;
}

export const postReplies = async ({
  cafeId,
  articleId,
  writerAccount,
  commenterAccounts,
  keyword,
  betweenRepliesDelayMs,
  comments: { commentResults, commentTexts, commentAuthors, commentIds },
}: PostRepliesParams): Promise<ReplyResult[]> => {
  const replyResults: ReplyResult[] = [];
  const successfulComments = commentResults.filter((c) => c.success);

  if (successfulComments.length < 2 || commentTexts.length < 2) {
    return replyResults;
  }

  const replyTasks = buildReplyTasks(writerAccount, commenterAccounts, commentAuthors, commentTexts);
  for (let j = 0; j < replyTasks.length; j++) {
    const task = replyTasks[j];
    const parentComment = commentTexts[task.targetCommentIndex];
    const parentAuthor = commentAuthors[task.targetCommentIndex];
    let replyText: string;
    try {
      if (task.isAuthor) {
        replyText = await generateAuthorReply(keyword, parentComment);
      } else {
        replyText = await generateReply(keyword, parentComment);
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
