import type { JobResult } from './types';

export interface WrittenReplyRecord {
  accountId: string;
  cafeId: string;
  articleId: number;
  nickname: string;
  content: string;
  parentIndex: number;
}

export interface WrittenReplyPersistenceDeps {
  addCommentToArticle: (
    cafeId: string,
    articleId: number,
    comment: {
      accountId: string;
      nickname: string;
      content: string;
      type: 'reply';
      parentIndex: number;
    },
  ) => Promise<boolean>;
}

export const persistWrittenReply = async (
  {
    accountId,
    articleId,
    cafeId,
    content,
    nickname,
    parentIndex,
  }: WrittenReplyRecord,
  { addCommentToArticle }: WrittenReplyPersistenceDeps,
): Promise<JobResult> => {
  try {
    const persisted = await addCommentToArticle(cafeId, articleId, {
      accountId,
      nickname,
      content,
      type: 'reply',
      parentIndex,
    });
    if (!persisted) {
      return {
        success: false,
        error: '대댓글 DB 저장 실패: 결과 없음',
        willRetry: true,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `대댓글 DB 저장 실패: ${message}`,
      willRetry: true,
    };
  }

  return { success: true };
};
