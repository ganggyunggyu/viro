import { NextResponse } from 'next/server';
import { getCafeById } from '@/shared/config/cafes';
import { connectDB } from '@/shared/lib/mongodb';
import {
  buildBaseFilter,
  fetchArticlesToModify,
} from '@/shared/lib/naver-cafe-writing';
import { authenticateAgentToken, getBearerToken } from '@/shared/lib/agent-broker';
import { generateImages, generateTeteContentByService } from '@/shared/api/content-api';
import { splitTitleBody } from '@/features/auto-comment/batch/rewrite-article-processor';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  const identity = await authenticateAgentToken(getBearerToken(request));
  if (!identity) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const operation = String(body.operation || '');
  const payload = body.payload && typeof body.payload === 'object'
    ? body.payload as Record<string, unknown>
    : {};
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
        generateTeteContentByService({ service, keyword }),
      ]);
      const { title, body: content } = splitTitleBody(contentResult.content);
      prepared.push({
        ...task,
        newTitle: title,
        newContent: content,
        images: imageResult.success ? imageResult.images || [] : [],
      });
    }
    return NextResponse.json({ tasks: prepared });
  }

  if (operation !== 'manual-modify') {
    return NextResponse.json({ error: 'unsupported operation' }, { status: 400 });
  }

  const cafeId = String(payload.cafeId || '');
  const cafe = await getCafeById(cafeId, identity.userId);
  if (!cafe) {
    return NextResponse.json({ error: 'cafe not found' }, { status: 404 });
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
  return NextResponse.json({
    articles: articles.map((article) => ({
      id: String(article._id),
      articleId: article.articleId,
      writerAccountId: article.writerAccountId,
    })),
  });
};
