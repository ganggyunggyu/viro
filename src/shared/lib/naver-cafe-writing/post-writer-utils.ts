export interface RecentCafeArticle {
  articleId: number;
  subject: string;
  writeDateTimestamp: number;
  menuId?: number;
}

export interface FindRecentArticleOptions {
  knownArticleIds?: Set<number>;
  publishStartedAt?: number;
  menuId?: number;
}

export interface BuildPostWriteFailureInput {
  writerAccountId: string;
  error: unknown;
  articleId?: number;
  articleUrl?: string;
}

export interface PostWriteFailure {
  success: false;
  writerAccountId: string;
  error: string;
  articleId?: number;
  articleUrl?: string;
}

export const buildPostWriteFailure = ({
  writerAccountId,
  error,
  articleId,
  articleUrl,
}: BuildPostWriteFailureInput): PostWriteFailure => ({
  success: false,
  writerAccountId,
  error: error instanceof Error ? error.message : '알 수 없는 오류',
  ...(articleId === undefined ? {} : { articleId }),
  ...(articleUrl === undefined ? {} : { articleUrl }),
});

export const extractArticleIdFromUrl = (url: string): number | undefined => {
  const decodedCandidates = new Set<string>([url]);
  let current = url;

  for (let i = 0; i < 2; i += 1) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) {
        break;
      }
      decodedCandidates.add(next);
      current = next;
    } catch {
      break;
    }
  }

  for (const candidate of decodedCandidates) {
    if (/\/articles\/write\b/i.test(candidate)) {
      continue;
    }

    const articleIdMatch =
      candidate.match(/articleid=(\d+)/i) ??
      candidate.match(/\/articles\/(\d+)(?:[/?#]|$)/i);

    if (articleIdMatch) {
      return Number.parseInt(articleIdMatch[1], 10);
    }
  }

  return undefined;
};

export const findRecentArticleBySubject = (
  articles: RecentCafeArticle[],
  subject: string,
  options?: FindRecentArticleOptions,
): RecentCafeArticle | undefined => {
  const { knownArticleIds = new Set<number>(), publishStartedAt = 0, menuId } = options ?? {};

  const matchingArticles = articles
    .filter((article) => article.subject === subject)
    .filter((article) => (menuId == null ? true : article.menuId === menuId))
    .filter((article) => !knownArticleIds.has(article.articleId))
    .filter((article) => article.writeDateTimestamp >= publishStartedAt)
    .sort((left, right) => right.writeDateTimestamp - left.writeDateTimestamp);

  return matchingArticles.length === 1 ? matchingArticles[0] : undefined;
};
