import type { BrokerClient } from '../lib/broker-client';
import type { ViroDesktopAction } from '../../src/shared/types/viro-desktop';
import { browseCafePosts } from '../../src/shared/lib/cafe-browser';
import { modifyArticleWithAccount } from '../../src/shared/lib/naver-cafe-writing';
import { assignDiverseKeywords } from '../../src/features/auto-comment/batch/rewrite-keyword-pool';
import { inferCafeService } from '../../src/features/auto-comment/batch/rewrite-cafe-service';
import { toAccount } from './shared';

const isWithinDateRange = (
  timestamp: number,
  dateFrom: string,
  dateTo: string,
): boolean => {
  const kst = new Date(timestamp + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return kst >= dateFrom && kst <= dateTo;
};

export const executeRewrite = async (
  broker: BrokerClient,
  action: Extract<ViroDesktopAction, { type: 'rewrite' }>,
): Promise<unknown> => {
  const { accounts: rawAccounts, cafes } = await broker.context();
  const accounts = rawAccounts.map(toAccount);
  const tasks: Array<{
    originalId?: string;
    cafeId: string;
    cafeName: string;
    articleId: number;
    subject: string;
    service: string;
    keyword?: string;
    writerAccountId: string;
  }> = [];

  for (const cafeId of action.input.cafeIds) {
    const cafe = cafes.find((item) => item.cafeId === cafeId);
    const account = accounts.find(({ id }) => id === cafe?.ownerAccountId);
    if (!cafe || !account) continue;
    const browsed = await browseCafePosts(account, cafeId, undefined, { page: 1, perPage: 50 });
    if (!browsed.success) continue;
    for (const article of browsed.articles) {
      if (article.articleId === 1 || !isWithinDateRange(
        article.writeDateTimestamp,
        action.input.dateFrom,
        action.input.dateTo,
      )) continue;
      tasks.push({
        cafeId,
        cafeName: cafe.name,
        articleId: article.articleId,
        subject: article.subject,
        service: inferCafeService(cafe.name),
        writerAccountId: account.id,
      });
    }
  }

  const customKeywords = (action.input.customKeywords || []).map((value) => value.trim()).filter(Boolean);
  const selected = action.input.keywordSource === 'custom'
    ? tasks.slice(0, customKeywords.length)
    : tasks;
  if (action.input.keywordSource === 'custom') {
    selected.forEach((task, index) => { task.keyword = customKeywords[index]; });
  } else {
    assignDiverseKeywords(selected);
  }
  if (selected.length === 0) {
    return { success: false, message: '지정한 날짜 범위에 재작성할 글이 없습니다', jobs: [], totalArticles: 0 };
  }

  const prepared = await broker.prepare('rewrite-content', { tasks: selected });
  const generated = Array.isArray(prepared.tasks)
    ? prepared.tasks as Array<typeof selected[number] & {
      newTitle: string;
      newContent: string;
      images: string[];
    }>
    : [];
  let completed = 0;
  const results: Array<{ cafeId: string; articleId: number; success: boolean }> = [];
  for (const task of generated) {
    const account = accounts.find(({ id }) => id === task.writerAccountId);
    if (!account || !task.newTitle || !task.newContent) continue;
    const modified = await modifyArticleWithAccount(account, {
      cafeId: task.cafeId,
      articleId: task.articleId,
      newTitle: task.newTitle,
      newContent: task.newContent,
      images: task.images,
    });
    if (modified.success) completed += 1;
    results.push({ cafeId: task.cafeId, articleId: task.articleId, success: modified.success });
  }

  for (const task of selected) {
    if (!results.some((result) => result.cafeId === task.cafeId && result.articleId === task.articleId)) results.push({ cafeId: task.cafeId, articleId: task.articleId, success: false });
  }
  return {
    success: completed > 0 && completed === selected.length,
    message: `${completed}/${selected.length}개 글을 로컬 Chrome에서 재작성했습니다`,
    jobs: [],
    totalArticles: selected.length, completed, failed: selected.length - completed, results,
  };
};

