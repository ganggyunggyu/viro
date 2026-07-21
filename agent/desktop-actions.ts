import { loginAccount } from '../src/shared/lib/multi-session';
import { checkArticleExposure } from '../src/shared/lib/exposure-check';
import { browseCafePosts } from '../src/shared/lib/cafe-browser';
import { getCafeWriterAccounts } from '../src/shared/config/cafe-account-policy';
import {
  modifyArticleWithAccount,
  writePostWithAccount,
} from '../src/shared/lib/naver-cafe-writing';
import { CAFE_TOPIC_PRESETS, createNaverCafe } from '../src/shared/lib/naver-cafe-creation';
import { joinCafeWithNicknameRetry } from '../src/features/auto-comment/batch/cafe-join';
import {
  changeByAccount,
  changeByCafe,
  type BatchNicknameResult,
} from '../src/features/auto-comment/batch/nickname-changer';
import type { NaverAccount } from '../src/shared/lib/account-manager';
import type { CafeConfig } from '../src/shared/config/cafes';
import type {
  ViroDesktopAction,
  ViroDesktopActionResponse,
} from '../src/shared/types/viro-desktop';
import type { BrokerClient, CommentAccount } from './lib/broker-client';
import { hydrateAgentSecrets } from './lib/agent-secrets';
import { validateDesktopAction } from './lib/desktop-action-contract';
import { assignDiverseKeywords } from '../src/features/auto-comment/batch/rewrite-keyword-pool';
import { inferCafeService } from '../src/features/auto-comment/batch/rewrite-cafe-service';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const toAccount = (account: CommentAccount): NaverAccount => ({
  id: account.accountId,
  password: account.password,
  nickname: account.nickname || account.accountId,
  isMain: account.isMain,
  role: account.role,
  excludeFromAutoComment: account.excludeFromAutoComment,
});

const executeJoinAll = async (broker: BrokerClient): Promise<unknown> => {
  const { accounts, cafes } = await broker.context();
  const results: Array<{
    success: boolean;
    accountId: string;
    cafeName: string;
    alreadyMember?: boolean;
    error?: string;
  }> = [];
  let joined = 0;
  let alreadyMember = 0;
  let failed = 0;

  for (const account of accounts) {
    for (const cafe of cafes) {
      const result = await joinCafeWithNicknameRetry(toAccount(account), cafe.cafeId, {
        cafeUrl: cafe.cafeUrl,
        updateDbNickname: async (nickname) => {
          await broker.sync('nickname', { accountId: account.accountId, nickname });
        },
      });
      results.push({ ...result, cafeName: cafe.name });
      if (result.alreadyMember) alreadyMember += 1;
      else if (result.success) joined += 1;
      else failed += 1;
      await sleep(3000);
    }
  }

  return {
    success: failed === 0,
    total: accounts.length * cafes.length,
    joined,
    alreadyMember,
    failed,
    results,
  };
};

const mergeNicknameResults = (results: BatchNicknameResult[]): BatchNicknameResult => {
  const rows = results.flatMap(({ results: items }) => items);
  const changed = rows.filter(({ success }) => success).length;
  return {
    success: changed === rows.length,
    total: rows.length,
    changed,
    failed: rows.length - changed,
    results: rows,
  };
};

const executeNicknameChange = async (
  broker: BrokerClient,
  action: Extract<ViroDesktopAction, { type: 'nickname-change' }>,
): Promise<BatchNicknameResult> => {
  const context = await broker.context();
  const accounts = context.accounts.map(toAccount);
  const cafes = context.cafes as CafeConfig[];

  if (action.mode === 'by-cafe') {
    const cafe = cafes.find(({ cafeId }) => cafeId === action.cafeId);
    if (!cafe) throw new Error('카페를 찾을 수 없습니다');
    return changeByCafe(accounts, cafe);
  }
  if (action.mode === 'by-account') {
    const account = accounts.find(({ id }) => id === action.accountId);
    if (!account) throw new Error('계정을 찾을 수 없습니다');
    return changeByAccount(account, cafes);
  }

  const batches: BatchNicknameResult[] = [];
  for (const cafe of cafes) {
    batches.push(await changeByCafe(accounts, cafe));
  }
  return mergeNicknameResults(batches);
};

const executeExposureCheck = async (
  broker: BrokerClient,
  action: Extract<ViroDesktopAction, { type: 'exposure-check' }>,
): Promise<unknown> => {
  const { accounts, cafes } = await broker.context();
  if (!accounts.some(({ accountId }) => accountId === action.accountId)) {
    throw new Error('노출 확인 계정을 찾을 수 없습니다');
  }

  const results = [];
  for (const item of action.items) {
    const cafe = cafes.find(({ cafeId }) => cafeId === item.cafeId);
    const checked = await checkArticleExposure({
      cafeId: item.cafeId,
      cafeUrl: cafe?.cafeUrl,
      cafeName: cafe?.name,
      keyword: item.keyword,
      accountId: action.accountId,
    });
    const row = { ...item, cafeName: cafe?.name || item.cafeId, ...checked };
    results.push(row);
    await broker.sync('exposure', row);
    await sleep(1500);
  }

  const exposed = results.filter(({ status }) => status === '노출').length;
  const notExposed = results.filter(({ status }) => status === '미노출').length;
  const failed = results.length - exposed - notExposed;
  return {
    success: true,
    total: results.length,
    exposed,
    notExposed,
    failed,
    results,
    message: `${results.length}건 확인 완료 (노출 ${exposed} / 미노출 ${notExposed} / 확인실패 ${failed})`,
  };
};

const executeCafeCreate = async (
  broker: BrokerClient,
  action: Extract<ViroDesktopAction, { type: 'cafe-create' }>,
): Promise<unknown> => {
  const { accounts } = await broker.context();
  const account = accounts.find(({ accountId }) => accountId === action.input.ownerAccountId);
  const preset = CAFE_TOPIC_PRESETS.find(({ key }) => key === action.input.presetKey);
  if (!account) throw new Error('계정을 찾을 수 없습니다');
  if (!preset) throw new Error('카테고리 프리셋을 찾을 수 없습니다');

  const result = await createNaverCafe(
    account.accountId,
    account.password,
    {
      name: action.input.name,
      slug: action.input.slug,
      categoryMajor: preset.categoryMajor,
      categoryMinor: preset.categoryMinor,
      description: action.input.description,
      keywords: action.input.keywords,
    },
    { dryRun: false },
  );
  if (!result.success || !result.cafeId || !result.cafeUrl) {
    return { success: false, error: result.error || '카페 생성 실패' };
  }

  const synced = await broker.sync('cafe-created', {
    cafeId: result.cafeId,
    cafeUrl: result.cafeUrl,
    name: result.name || action.input.name,
    ownerAccountId: account.accountId,
    ownerNickname: account.nickname,
    presetKey: action.input.presetKey,
    slug: action.input.slug,
  });
  return {
    success: true,
    cafeId: result.cafeId,
    cafeUrl: result.cafeUrl,
    sheetSynced: Boolean(synced.sheetSynced),
  };
};

const executeManualPublish = async (
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
    success: completed === results.length,
    totalManuscripts: results.length,
    completed,
    failed: results.length - completed,
    results,
  };
};

const executeManualModify = async (
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
    success: completed === results.length,
    totalManuscripts: results.length,
    completed,
    failed: results.length - completed,
    results,
  };
};

const isWithinDateRange = (
  timestamp: number,
  dateFrom: string,
  dateTo: string,
): boolean => {
  const kst = new Date(timestamp + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return kst >= dateFrom && kst <= dateTo;
};

const executeRewrite = async (
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
  }

  return {
    success: completed > 0 && completed === generated.length,
    message: `${completed}/${generated.length}개 글을 로컬 Chrome에서 재작성했습니다`,
    jobs: [],
    totalArticles: generated.length,
  };
};

export const executeDesktopAction = async (
  value: unknown,
  broker: BrokerClient,
): Promise<ViroDesktopActionResponse> => {
  try {
    const action = validateDesktopAction(value);
    await hydrateAgentSecrets(broker);
    if (action.type === 'account-login') {
      const { accounts } = await broker.context();
      const account = accounts.find(({ accountId }) => accountId === action.accountId);
      if (!account) throw new Error('계정을 찾을 수 없습니다');
      const result = await loginAccount(account.accountId, account.password, {
        reason: 'desktop_account_check',
      });
      return { success: result.success, result, error: result.error };
    }
    if (action.type === 'cafe-join-all') {
      return { success: true, result: await executeJoinAll(broker) };
    }
    if (action.type === 'nickname-change') {
      return { success: true, result: await executeNicknameChange(broker, action) };
    }
    if (action.type === 'exposure-check') {
      return { success: true, result: await executeExposureCheck(broker, action) };
    }
    if (action.type === 'cafe-create') {
      return { success: true, result: await executeCafeCreate(broker, action) };
    }
    if (action.type === 'manual-publish') {
      return { success: true, result: await executeManualPublish(broker, action) };
    }
    if (action.type === 'manual-modify') {
      return { success: true, result: await executeManualModify(broker, action) };
    }
    return { success: true, result: await executeRewrite(broker, action) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '로컬 실행 실패',
    };
  }
};
