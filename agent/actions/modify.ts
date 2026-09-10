import type { BrokerClient } from '../lib/broker-client';
import type { ViroDesktopAction } from '../../src/shared/types/viro-desktop';
import { modifyArticleWithAccount } from '../../src/shared/lib/naver-cafe-writing';
import { toAccount } from './shared';

export const executeManualModify = async (
  broker: BrokerClient,
  action: Extract<ViroDesktopAction, { type: 'manual-modify' }>,
): Promise<unknown> => {
  const { accounts: rawAccounts, cafes } = await broker.context();
  const accounts = rawAccounts.map(toAccount);
  const cafe = action.input.cafeId
    ? cafes.find(({ cafeId }) => cafeId === action.input.cafeId)
    : cafes.find(({ isDefault }) => isDefault) || cafes[0];
  if (!cafe) throw new Error('카페 정보를 찾을 수 없습니다');

  const prepared = await broker.prepare('manual-modify', {
    cafeId: cafe.cafeId,
    count: action.input.manuscripts.length,
    daysLimit: action.input.daysLimit,
    sortOrder: action.input.sortOrder,
  });
  const articles = Array.isArray(prepared.articles)
    ? prepared.articles as Array<{ id: string; articleId: number; writerAccountId: string }>
    : [];
  const count = Math.min(articles.length, action.input.manuscripts.length);
  const results = [];

  for (let index = 0; index < count; index += 1) {
    const manuscript = action.input.manuscripts[index];
    const article = articles[index];
    const account = accounts.find(({ id }) => id === article.writerAccountId);
    if (!account) {
      results.push({
        folderName: manuscript.folderName,
        originalArticleId: article.articleId,
        newTitle: manuscript.title,
        success: false,
        error: `작성자 계정(${article.writerAccountId})이 없습니다`,
      });
      continue;
    }

    const modified = await modifyArticleWithAccount(account, {
      cafeId: cafe.cafeId,
      articleId: article.articleId,
      newTitle: manuscript.title,
      newContent: manuscript.htmlContent,
      category: manuscript.category,
      images: manuscript.images.length > 0 ? manuscript.images : undefined,
    });
    results.push({
      folderName: manuscript.folderName,
      originalArticleId: article.articleId,
      newTitle: manuscript.title,
      success: modified.success,
      error: modified.error,
    });
    if (modified.success) {
      await broker.sync('article-modified', {
        originalId: article.id,
        articleId: article.articleId,
        cafeId: cafe.cafeId,
        keyword: manuscript.folderName,
        newTitle: manuscript.title,
        newContent: manuscript.htmlContent,
        modifiedBy: account.id,
      });
    }
  }

  for (const manuscript of action.input.manuscripts.slice(count)) {
    results.push({
      folderName: manuscript.folderName,
      originalArticleId: 0,
      newTitle: manuscript.title,
      success: false,
      error: '수정 가능한 발행원고가 없습니다',
    });
  }

  const completed = results.filter(({ success }) => success).length;
  return {
    success: results.length > 0 && completed === results.length,
    totalManuscripts: results.length,
    completed,
    failed: results.length - completed,
    results,
  };
};

