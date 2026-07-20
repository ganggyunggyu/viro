import { PublishedArticle, type IPublishedArticle } from '@/shared/models';

export type ArticleModifySortOrder = 'oldest' | 'newest' | 'random';

export interface QueryFilter {
  cafeId: string;
  status: string;
  isExternal: { $ne: true };
  publishedAt?: { $gte: Date };
}

export const buildBaseFilter = (cafeId: string, daysLimit?: number): QueryFilter => {
  const baseFilter: QueryFilter = {
    cafeId,
    status: 'published',
    isExternal: { $ne: true },
  };
  if (daysLimit) {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - daysLimit);
    baseFilter.publishedAt = { $gte: limitDate };
    console.log(`[MODIFY BATCH] ${daysLimit}일 이내 원고만 조회 (${limitDate.toISOString()} 이후)`);
  }
  return baseFilter;
}

export const fetchArticlesToModify = async (
  sortOrder: ArticleModifySortOrder,
  limit: number,
  baseFilter: QueryFilter
): Promise<IPublishedArticle[]> => {
  if (sortOrder === 'random') {
    return PublishedArticle.aggregate([
      { $match: baseFilter },
      { $sample: { size: limit } },
    ]);
  }

  const sortDirection = sortOrder === 'oldest' ? 1 : -1;
  return PublishedArticle.find(baseFilter).sort({ publishedAt: sortDirection }).limit(limit);
};
