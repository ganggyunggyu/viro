export interface PostWriteResult {
  success: boolean;
  articleId?: number;
  articleUrl?: string;
  writerAccountId: string;
  error?: string;
}

export interface RecoveredArticle {
  articleId: number;
  articleUrl?: string;
}

export interface PostOutcomePost {
  cafeId: string;
  menuId: string;
  keyword?: string;
  subject: string;
  content: string;
  writerAccountId: string;
  postType?: 'ad' | 'daily' | 'daily-ad';
}

export interface PublishedArticleRecord {
  articleId?: number;
  cafeId: string;
  menuId: string;
  keyword: string;
  title: string;
  content: string;
  articleUrl: string;
  writerAccountId: string;
  status: 'published' | 'published-unverified';
  postType?: 'ad' | 'daily' | 'daily-ad';
  commentCount: number;
  replyCount: number;
  comments: never[];
}

export interface PostOutcomeDeps {
  claimPostAttempt: (
    cafeId: string,
    writerAccountId: string,
    keyword: string,
  ) => Promise<boolean>;
  releaseClaim: (
    cafeId: string,
    writerAccountId: string,
    keyword: string,
  ) => Promise<unknown>;
  writer: () => Promise<PostWriteResult>;
  findRecentArticleBySubject: (input: {
    cafeId: string;
    menuId: string;
    subject: string;
    publishStartedAt: number;
  }) => Promise<RecoveredArticle | undefined>;
  publishedArticle: {
    create: (record: PublishedArticleRecord) => Promise<unknown>;
  };
  sheetLogger: (record: PublishedArticleRecord) => Promise<{ success: boolean; error?: string }>;
  incrementTodayPostCount: (writerAccountId: string, cafeId: string) => Promise<unknown>;
  enqueueCommentChain: (articleId: number) => Promise<void>;
  now: () => number;
  onNonFatalError: (stage: string, error: unknown) => void;
}

export interface PostOutcomeResult {
  success: true;
  articleId?: number;
  articleUrl?: string;
  skipped?: boolean;
}

const runNonFatal = async (
  stage: string,
  action: () => Promise<unknown>,
  deps: PostOutcomeDeps,
): Promise<void> => {
  const { onNonFatalError } = deps;
  try {
    await action();
  } catch (error) {
    onNonFatalError(stage, error);
  }
};

export const resolvePostOutcome = async ({
  post,
  deps,
}: {
  post: PostOutcomePost;
  deps: PostOutcomeDeps;
}): Promise<PostOutcomeResult> => {
  const {
    cafeId,
    menuId,
    keyword,
    subject,
    content,
    writerAccountId,
    postType,
  } = post;
  const {
    claimPostAttempt,
    releaseClaim,
    writer,
    findRecentArticleBySubject,
    publishedArticle,
    sheetLogger,
    incrementTodayPostCount,
    enqueueCommentChain,
    now,
  } = deps;
  const publishStartedAt = now();
  const claimKeyword = keyword || subject;
  const claimed = await claimPostAttempt(cafeId, writerAccountId, claimKeyword);

  if (!claimed) {
    return { success: true, skipped: true };
  }

  const writeResult = await writer();
  let { articleId } = writeResult;
  let recoveredArticle: RecoveredArticle | undefined;

  if (!articleId) {
    await runNonFatal('article-recovery', async () => {
      recoveredArticle = await findRecentArticleBySubject({
        cafeId,
        menuId,
        subject,
        publishStartedAt,
      });
      articleId = recoveredArticle?.articleId;
    }, deps);
  }

  const observedPublish = writeResult.success || Boolean(writeResult.articleUrl) || Boolean(articleId);
  if (!observedPublish) {
    await releaseClaim(cafeId, writerAccountId, claimKeyword);
    throw new Error(writeResult.error || '글 작성 실패');
  }

  const articleUrl = writeResult.articleUrl
    ?? recoveredArticle?.articleUrl
    ?? (articleId ? `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}` : undefined);
  const record: PublishedArticleRecord = {
    articleId,
    cafeId,
    menuId,
    keyword: keyword || '',
    title: subject,
    content,
    articleUrl: articleUrl || '',
    writerAccountId,
    status: articleId ? 'published' : 'published-unverified',
    postType,
    commentCount: 0,
    replyCount: 0,
    comments: [],
  };

  const publishedArticleStage = articleId
    ? 'published-article'
    : 'published-article-unverified';
  await runNonFatal(publishedArticleStage, () => publishedArticle.create(record), deps);
  await runNonFatal(
    'daily-post-count',
    () => incrementTodayPostCount(writerAccountId, cafeId),
    deps,
  );
  await runNonFatal('sheet-log', async () => {
    const result = await sheetLogger(record);
    if (!result.success) {
      throw new Error(result.error || '발행 시트 기록 실패');
    }
  }, deps);

  if (articleId) {
    const verifiedArticleId = articleId;
    await runNonFatal('comment-chain', () => enqueueCommentChain(verifiedArticleId), deps);
  }

  return { success: true, articleId, articleUrl };
};
