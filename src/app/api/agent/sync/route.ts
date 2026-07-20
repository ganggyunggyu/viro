import { NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/mongodb';
import { Account } from '@/shared/models/account';
import {
  incrementTodayPostCount,
  ModifiedArticle,
  PublishedArticle,
  updateArticleExposure,
} from '@/shared/models';
import { logExposureResultToSheet } from '@/shared/lib/publish-log-sheet';
import {
  authenticateAgentToken,
  getBearerToken,
} from '@/shared/lib/agent-broker';
import {
  CAFE_TOPIC_PRESETS,
  registerCreatedCafeInDb,
} from '@/shared/lib/naver-cafe-creation';
import { syncCafeToOperationsSheet } from '@/shared/lib/naver-cafe-creation/sheet-sync';

export const runtime = 'nodejs';

interface ExposurePayload {
  cafeId: string;
  articleId?: number;
  status: '노출' | '미노출' | '확인실패';
  rank?: number;
  foundLink?: string;
}

const syncNickname = async (
  userId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const accountId = String(payload.accountId || '');
  const nickname = String(payload.nickname || '');
  if (!accountId || !nickname) {
    throw new Error('accountId와 nickname이 필요합니다');
  }
  const result = await Account.updateOne(
    { userId, accountId },
    { $set: { nickname } },
  );
  return { ok: result.matchedCount > 0 };
};

const syncExposure = async (
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const input = payload as unknown as ExposurePayload;
  if (input.articleId) {
    await updateArticleExposure(input.cafeId, input.articleId, {
      status: input.status,
      rank: input.rank,
      foundLink: input.foundLink,
    });
  }
  const sheet = await logExposureResultToSheet(input);
  return { ok: true, sheetSynced: sheet.success };
};

const syncCafeCreated = async (
  userId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const cafeId = String(payload.cafeId || '');
  const cafeUrl = String(payload.cafeUrl || '');
  const name = String(payload.name || '');
  const ownerAccountId = String(payload.ownerAccountId || '');
  const ownerNickname = String(payload.ownerNickname || ownerAccountId);
  const presetKey = String(payload.presetKey || '');
  const slug = String(payload.slug || '');
  const preset = CAFE_TOPIC_PRESETS.find(({ key }) => key === presetKey);

  if (!cafeId || !cafeUrl || !name || !ownerAccountId || !preset) {
    throw new Error('카페 생성 결과가 올바르지 않습니다');
  }

  await registerCreatedCafeInDb(
    userId,
    { cafeId, cafeUrl, name },
    { ownerAccountId },
  );
  const sheet = await syncCafeToOperationsSheet({
    category: preset.sheetCategory,
    name,
    cafeId,
    slug,
    ownerAccountId,
    ownerNickname,
    memberCount: 1,
  });
  return { ok: true, sheetSynced: sheet.cafeInfoAdded };
};

const syncArticlePublished = async (
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const articleId = Number(payload.articleId);
  const cafeId = String(payload.cafeId || '');
  const menuId = String(payload.menuId || '');
  const keyword = String(payload.keyword || '');
  const title = String(payload.title || '');
  const content = String(payload.content || '');
  const writerAccountId = String(payload.writerAccountId || '');
  const articleUrl = String(
    payload.articleUrl || `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`,
  );
  if (!articleId || !cafeId || !writerAccountId) {
    throw new Error('발행 결과가 올바르지 않습니다');
  }

  const existing = await PublishedArticle.exists({ cafeId, articleId });
  await PublishedArticle.updateOne(
    { cafeId, articleId },
    {
      $setOnInsert: {
        articleId,
        cafeId,
        menuId,
        keyword,
        title,
        content,
        articleUrl,
        writerAccountId,
        status: 'published',
        commentCount: 0,
        replyCount: 0,
      },
    },
    { upsert: true },
  );
  if (!existing) {
    await incrementTodayPostCount(writerAccountId, cafeId);
  }
  const sheet = await import('@/shared/lib/publish-log-sheet').then(({ logPublishToSheet }) =>
    logPublishToSheet({ cafeId, keyword, articleId, articleUrl, writerAccountId }));
  return { ok: true, sheetSynced: sheet.success };
};

const syncArticleModified = async (
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const originalId = String(payload.originalId || '');
  const articleId = Number(payload.articleId);
  const cafeId = String(payload.cafeId || '');
  const keyword = String(payload.keyword || '');
  const newTitle = String(payload.newTitle || '');
  const newContent = String(payload.newContent || '');
  const modifiedBy = String(payload.modifiedBy || '');
  if (!originalId || !articleId || !cafeId || !modifiedBy) {
    throw new Error('수정 결과가 올바르지 않습니다');
  }

  await ModifiedArticle.updateOne(
    { cafeId, articleId },
    {
      $set: {
        originalArticleId: originalId,
        articleId,
        cafeId,
        keyword,
        newTitle,
        newContent,
        modifiedAt: new Date(),
        modifiedBy,
      },
    },
    { upsert: true },
  );
  await PublishedArticle.deleteOne({ _id: originalId, cafeId, articleId });
  return { ok: true };
};

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

  try {
    await connectDB();
    const result = operation === 'nickname'
      ? await syncNickname(identity.userId, payload)
      : operation === 'exposure'
        ? await syncExposure(payload)
        : operation === 'cafe-created'
          ? await syncCafeCreated(identity.userId, payload)
          : operation === 'article-published'
            ? await syncArticlePublished(payload)
            : operation === 'article-modified'
              ? await syncArticleModified(payload)
              : null;

    if (!result) {
      return NextResponse.json({ error: 'unsupported operation' }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'sync failed' },
      { status: 400 },
    );
  }
};
