import type { BrokerClient } from '../lib/broker-client';
import type { ViroDesktopAction } from '../../src/shared/types/viro-desktop';
import { getCafeWriterAccounts } from '../../src/shared/config/cafe-account-policy';
import { writePostWithAccount } from '../../src/shared/lib/naver-cafe-writing';
import { toAccount } from './shared';

export const executeManualPublish = async (
  broker: BrokerClient,
  action: Extract<ViroDesktopAction, { type: 'manual-publish' }>,
): Promise<unknown> => {
  const { accounts: rawAccounts, cafes } = await broker.context();
  const accounts = rawAccounts.map(toAccount);
  const cafe = action.input.cafeId
    ? cafes.find(({ cafeId }) => cafeId === action.input.cafeId)
    : cafes.find(({ isDefault }) => isDefault) || cafes[0];
  if (!cafe) throw new Error('카페 정보를 찾을 수 없습니다');

  const writers = getCafeWriterAccounts(accounts, cafe.cafeId);
  if (writers.length === 0) throw new Error(`글쓰기 가능한 계정이 없습니다 (${cafe.name})`);

  const results = [];
  for (let index = 0; index < action.input.manuscripts.length; index += 1) {
    const manuscript = action.input.manuscripts[index];
    const writer = writers[index % writers.length];
    const menuId = manuscript.category && cafe.categoryMenuIds?.[manuscript.category]
      ? cafe.categoryMenuIds[manuscript.category]
      : cafe.menuId;
    const published = await writePostWithAccount(writer, {
      cafeId: cafe.cafeId,
      menuId,
      subject: manuscript.title,
      content: manuscript.htmlContent,
      category: manuscript.category,
      postOptions: action.input.postOptions,
      images: manuscript.images.length > 0 ? manuscript.images : undefined,
    });

    const row = {
      folderName: manuscript.folderName,
      title: manuscript.title,
      success: published.success,
      articleId: published.articleId,
      articleUrl: published.articleUrl,
      error: published.error,
    };
    results.push(row);

    if (published.success && published.articleId) {
      await broker.sync('article-published', {
        articleId: published.articleId,
        articleUrl: published.articleUrl,
        cafeId: cafe.cafeId,
        menuId,
        keyword: manuscript.folderName,
        title: manuscript.title,
        content: manuscript.htmlContent,
        writerAccountId: writer.id,
      });
    }
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

