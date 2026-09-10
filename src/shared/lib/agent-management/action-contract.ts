import type { ViroDesktopAction } from '@/shared/types/viro-desktop';
import { AgentManagementError, objectBody, textField } from '@/shared/lib/agent-management/contract';

export const ACTION_TYPES = ['account-login', 'cafe-join-all', 'nickname-change', 'exposure-check', 'cafe-create', 'manual-publish', 'manual-modify', 'rewrite'] as const;
const id = (value: unknown): string => textField(value, 'ID', 64);
const array = (value: unknown, max = 100): unknown[] => {
  if (!Array.isArray(value) || value.length < 1 || value.length > max) throw new AgentManagementError(`항목은 1~${max}개여야 합니다`);
  return value;
};
const enumeration = <T extends string>(value: unknown, values: readonly T[]): T => {
  if (!values.includes(value as T)) throw new AgentManagementError('선택 값이 올바르지 않습니다');
  return value as T;
};
const date = (value: unknown): string => {
  const text = textField(value, '날짜', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text) throw new AgentManagementError('날짜가 올바르지 않습니다');
  return text;
};

/** 원격 요청에는 워커 PC의 파일 경로나 비밀번호를 받지 않는다. */
export const parseRemoteAction = (raw: unknown): ViroDesktopAction => {
  const body = objectBody(raw, ['type', 'accountId', 'cafeId', 'mode', 'items', 'input']);
  const type = enumeration(body.type, ACTION_TYPES);
  const fields: Record<typeof type, string[]> = {
    'account-login': ['type', 'accountId'], 'cafe-join-all': ['type'],
    'nickname-change': ['type', 'mode', 'accountId', 'cafeId'], 'exposure-check': ['type', 'accountId', 'items'],
    'cafe-create': ['type', 'input'], 'manual-publish': ['type', 'input'], 'manual-modify': ['type', 'input'], rewrite: ['type', 'input'],
  };
  objectBody(body, fields[type]);
  if (type === 'account-login') return { type, accountId: id(body.accountId) };
  if (type === 'cafe-join-all') return { type };
  if (type === 'nickname-change') {
    const mode = enumeration(body.mode, ['by-cafe', 'by-account', 'all']);
    if ((mode !== 'by-cafe' && body.cafeId !== undefined) || (mode !== 'by-account' && body.accountId !== undefined)) throw new AgentManagementError('선택한 변경 범위와 대상이 다릅니다');
    return { type, mode, ...(mode === 'by-cafe' ? { cafeId: id(body.cafeId) } : {}), ...(mode === 'by-account' ? { accountId: id(body.accountId) } : {}) };
  }
  if (type === 'exposure-check') return { type, accountId: id(body.accountId), items: array(body.items).map((rawItem) => {
    const item = objectBody(rawItem, ['cafeId', 'keyword', 'articleId']);
    if (item.articleId !== undefined && (!Number.isSafeInteger(item.articleId) || Number(item.articleId) < 1)) throw new AgentManagementError('글 번호가 올바르지 않습니다');
    return { cafeId: id(item.cafeId), keyword: textField(item.keyword, '키워드', 200), ...(item.articleId !== undefined ? { articleId: Number(item.articleId) } : {}) };
  }) };
  if (type === 'cafe-create') {
    const input = objectBody(body.input, ['ownerAccountId', 'name', 'slug', 'presetKey', 'description', 'keywords']);
    const slug = textField(input.slug, '카페 주소', 100);
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(slug)) throw new AgentManagementError('카페 주소가 올바르지 않습니다');
    return { type, input: { ownerAccountId: id(input.ownerAccountId), name: textField(input.name, '카페 이름', 100), slug,
      presetKey: textField(input.presetKey, '카테고리', 100), description: textField(input.description, '소개', 1000),
      keywords: array(input.keywords, 10).map((value) => textField(value, '키워드', 100)) } };
  }
  if (type === 'rewrite') {
    const input = objectBody(body.input, ['cafeIds', 'dateFrom', 'dateTo', 'keywordSource', 'customKeywords']);
    const dateFrom = date(input.dateFrom); const dateTo = date(input.dateTo);
    if (dateFrom > dateTo) throw new AgentManagementError('시작일은 종료일 이전이어야 합니다');
    const keywordSource = enumeration(input.keywordSource, ['pool', 'custom']);
    return { type, input: { cafeIds: array(input.cafeIds, 20).map(id), dateFrom, dateTo, keywordSource,
      ...(keywordSource === 'custom' ? { customKeywords: array(input.customKeywords).map((value) => textField(value, '키워드', 200)) } : {}) } };
  }
  const input = objectBody(body.input, ['cafeId', 'manuscripts', ...(type === 'manual-modify' ? ['daysLimit', 'sortOrder'] : [])]);
  // 기본 카페를 암묵적으로 고르면 승인한 대상과 달라질 수 있으므로 원격 요청은 필수다.
  const cafeId = id(input.cafeId);
  const manuscripts = array(input.manuscripts, 20).map((rawItem) => {
    const item = objectBody(rawItem, ['folderName', 'title', 'htmlContent', 'body', 'images', 'category']);
    if (item.images !== undefined && (!Array.isArray(item.images) || item.images.length !== 0)) throw new AgentManagementError('원격 원고 이미지는 현재 지원하지 않습니다. images는 빈 배열로 보내세요');
    return { folderName: textField(item.folderName, '원고 이름', 200), title: textField(item.title, '제목', 200),
      htmlContent: textField(item.htmlContent, '본문', 20000), body: item.body === undefined || item.body === '' ? '' : textField(item.body, '본문 텍스트', 20000), images: [],
      ...(item.category !== undefined ? { category: textField(item.category, '분류', 100) } : {}) };
  });
  if (type === 'manual-publish') return { type, input: { cafeId, manuscripts } };
  const daysLimit = input.daysLimit ?? 30;
  if (!Number.isInteger(daysLimit) || Number(daysLimit) < 1 || Number(daysLimit) > 365) throw new AgentManagementError('기간은 1~365일이어야 합니다');
  return { type, input: { cafeId, manuscripts, daysLimit: Number(daysLimit), sortOrder: enumeration(input.sortOrder ?? 'oldest', ['oldest', 'newest', 'random'] as const) } };
};

export const actionResources = (action: ViroDesktopAction): { accountIds: string[]; cafeIds: string[] } => {
  const accountIds = 'accountId' in action && action.accountId ? [action.accountId] : [];
  if (action.type === 'cafe-create') accountIds.push(action.input.ownerAccountId);
  const cafeIds = action.type === 'exposure-check' ? action.items.map(({ cafeId }) => cafeId)
    : action.type === 'rewrite' ? action.input.cafeIds
      : 'cafeId' in action && action.cafeId ? [action.cafeId]
        : (action.type === 'manual-publish' || action.type === 'manual-modify') && action.input.cafeId ? [action.input.cafeId] : [];
  return { accountIds: [...new Set(accountIds)], cafeIds: [...new Set(cafeIds)] };
};
