export interface ReplyIdentityInput {
  accountId: string;
  cafeId: string;
  articleId: number;
  parentIndex: number;
  content: string;
}

export interface ReplyIdempotencyDeps {
  hasReplied: (
    cafeId: string,
    articleId: number,
    accountId: string,
    parentIndex: number,
    content: string,
  ) => Promise<boolean>;
}

export const shouldSkipReplyWrite = async (
  { accountId, articleId, cafeId, content, parentIndex }: ReplyIdentityInput,
  { hasReplied }: ReplyIdempotencyDeps,
): Promise<boolean> => hasReplied(cafeId, articleId, accountId, parentIndex, content);
