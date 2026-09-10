import { getCafeById } from '@/shared/config/cafes';
import { connectDB } from '@/shared/lib/mongodb';
import {
  buildBaseFilter,
  fetchArticlesToModify,
} from '@/shared/lib/naver-cafe-writing/modify-query-utils';
import {
  generateImages,
  generateTeteContentByServiceWithFallback,
  generateTeteContentWithFallback,
} from '@/shared/api/content-api';
import { splitTitleBody } from '@/features/auto-comment/batch/rewrite-article-processor';
import { parseKeywordWithCategory } from '@/features/auto-comment/batch/keyword-utils';
import { buildCafePostContent } from '@/shared/lib/cafe-content';
import type { CreateManualCommentJobInput } from '@/features/manual-comment-job/actions';

export const prepareBrokerTask = async (userId: string, operation: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> => {
  if (operation === 'post-content') {
    const keywords = Array.isArray(payload.keywords)
      ? payload.keywords.map(String).map((value) => value.trim()).filter(Boolean)
      : [];
    const ref = typeof payload.ref === 'string' && payload.ref.trim()
      ? payload.ref.trim()
      : undefined;
    const attachImages = payload.attachImages === true;
    const manuscripts = [];
    for (const keywordInput of keywords) {
      const { keyword, category } = parseKeywordWithCategory(keywordInput);
      const keywordLabel = category ? `${keyword}:${category}` : keyword;
      const [generated, imageResult] = await Promise.all([
        generateTeteContentWithFallback({ keyword: keywordLabel, ref }),
        attachImages
          ? generateImages({ keyword, count: 3 })
          : Promise.resolve({ success: true, images: [] }),
      ]);
      const { title, htmlContent } = buildCafePostContent(generated.content, keywordLabel);
      manuscripts.push({
        folderName: keywordLabel,
        title,
        body: generated.content,
        htmlContent,
        images: imageResult.images || [],
        category,
      });
    }
    return { manuscripts };
  }

  if (operation === 'comment-job') {
    const { createManualCommentJobForUser } = await import('@/features/manual-comment-job/actions');
    const result = await createManualCommentJobForUser(
      userId,
      payload as unknown as CreateManualCommentJobInput,
    );
    return result;
  }

  if (operation === 'rewrite-content') {
    const tasks = Array.isArray(payload.tasks)
      ? payload.tasks as Array<Record<string, unknown>>
      : [];
    const prepared = [];
    for (const task of tasks) {
      const keyword = String(task.keyword || task.subject || '');
      const service = String(task.service || '일반');
      const [imageResult, contentResult] = await Promise.all([
        generateImages({ keyword, count: 3 }),
        generateTeteContentByServiceWithFallback({ service, keyword }),
      ]);
      const { title, body: content } = splitTitleBody(contentResult.content);
      prepared.push({
        ...task,
        newTitle: title,
        newContent: content,
        images: imageResult.success ? imageResult.images || [] : [],
      });
    }
    return { tasks: prepared };
  }

  if (operation !== 'manual-modify') {
    throw new Error('unsupported operation');
  }

  const cafeId = String(payload.cafeId || '');
  const cafe = await getCafeById(cafeId, userId);
  if (!cafe) {
    throw new Error('cafe not found');
  }

  const count = Math.max(1, Math.min(100, Number(payload.count) || 1));
  const daysLimit = payload.daysLimit === undefined ? undefined : Number(payload.daysLimit);
  const sortOrder = payload.sortOrder === 'newest' || payload.sortOrder === 'random'
    ? payload.sortOrder
    : 'oldest';

  await connectDB();
  const articles = await fetchArticlesToModify(
    sortOrder,
    count,
    buildBaseFilter(cafeId, daysLimit),
  );
  return {
    articles: articles.map((article) => ({
      id: String(article._id),
      articleId: article.articleId,
      writerAccountId: article.writerAccountId,
    })),
  };
};
