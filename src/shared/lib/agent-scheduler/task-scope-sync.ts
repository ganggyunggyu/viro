import type { ViroDesktopAction } from '@/shared/types/viro-desktop';
import {
  cafeSlug, denyTaskScope, hasTaskAccount, isArticleId, isDocumentId, isEligibleWriter,
  isNaverPath, isScopeText, requireTaskScope, scopeObject, taskCafe, type TaskContext,
} from '@/shared/lib/agent-scheduler/task-scope-payload';

const assertNickname = (action: ViroDesktopAction, payload: unknown, context: TaskContext): void => {
  requireTaskScope(action.type === 'nickname-change' || action.type === 'cafe-join-all');
  const body = scopeObject(payload, ['accountId', 'nickname']);
  requireTaskScope(hasTaskAccount(context, body.accountId) && isScopeText(body.nickname, 100));
};
const assertExposure = (action: ViroDesktopAction, payload: unknown, context: TaskContext): void => {
  requireTaskScope(action.type === 'exposure-check');
  const body = scopeObject(payload, ['cafeId', 'articleId', 'keyword', 'cafeName', 'status', 'rank', 'foundTitle', 'foundLink', 'error']);
  const cafe = taskCafe(context, body.cafeId);
  requireTaskScope(hasTaskAccount(context, action.accountId));
  requireTaskScope(action.items.some(({ cafeId, articleId, keyword }) => cafeId === body.cafeId && articleId === body.articleId && keyword === body.keyword));
  requireTaskScope(body.cafeName === undefined || body.cafeName === cafe.name);
  requireTaskScope(['노출', '미노출', '확인실패'].includes(String(body.status)));
  requireTaskScope(body.rank === undefined || isArticleId(body.rank));
  requireTaskScope(body.foundTitle === undefined || (typeof body.foundTitle === 'string' && body.foundTitle.length <= 2000));
  requireTaskScope(body.foundLink === undefined || (typeof body.foundLink === 'string' && body.foundLink.length <= 2000));
  requireTaskScope(body.error === undefined || (typeof body.error === 'string' && body.error.length <= 2000));
};
const assertPublished = (action: ViroDesktopAction, payload: unknown, context: TaskContext): void => {
  requireTaskScope(action.type === 'manual-publish');
  const body = scopeObject(payload, ['articleId', 'articleUrl', 'cafeId', 'menuId', 'keyword', 'title', 'content', 'writerAccountId']);
  const cafe = taskCafe(context, body.cafeId);
  requireTaskScope(body.cafeId === action.input.cafeId && isArticleId(body.articleId));
  requireTaskScope(context.accounts.some((account) => account.accountId === body.writerAccountId && isEligibleWriter(account, cafe)));
  requireTaskScope(action.input.manuscripts.some((manuscript) => {
    const menuId = manuscript.category && cafe.categoryMenuIds?.[manuscript.category] ? cafe.categoryMenuIds[manuscript.category] : cafe.menuId;
    return body.keyword === manuscript.folderName && body.title === manuscript.title && body.content === manuscript.htmlContent && body.menuId === menuId;
  }));
  requireTaskScope(body.articleUrl === undefined || isNaverPath(body.articleUrl, [`/ca-fe/cafes/${cafe.cafeId}/articles/${body.articleId}`, `/${cafeSlug(cafe)}/${body.articleId}`]));
};
const assertModified = (action: ViroDesktopAction, payload: unknown, context: TaskContext): void => {
  requireTaskScope(action.type === 'manual-modify');
  const body = scopeObject(payload, ['originalId', 'articleId', 'cafeId', 'keyword', 'newTitle', 'newContent', 'modifiedBy']);
  taskCafe(context, body.cafeId);
  requireTaskScope(body.cafeId === action.input.cafeId && hasTaskAccount(context, body.modifiedBy));
  requireTaskScope(isDocumentId(body.originalId) && isArticleId(body.articleId));
  requireTaskScope(action.input.manuscripts.some(({ folderName, title, htmlContent }) => body.keyword === folderName && body.newTitle === title && body.newContent === htmlContent));
};
const assertCreated = (action: ViroDesktopAction, payload: unknown, context: TaskContext): void => {
  requireTaskScope(action.type === 'cafe-create');
  const body = scopeObject(payload, ['cafeId', 'cafeUrl', 'name', 'ownerAccountId', 'ownerNickname', 'presetKey', 'slug']);
  const { input } = action;
  requireTaskScope(hasTaskAccount(context, body.ownerAccountId) && body.ownerAccountId === input.ownerAccountId);
  requireTaskScope(body.presetKey === input.presetKey && body.slug === input.slug && body.name === input.name);
  requireTaskScope(typeof body.cafeId === 'string' && /^[1-9]\d{0,19}$/.test(body.cafeId));
  requireTaskScope(isNaverPath(body.cafeUrl, [`/${input.slug}`]));
  requireTaskScope(body.ownerNickname === undefined || isScopeText(body.ownerNickname, 100));
};

export const assertTaskSync = (action: ViroDesktopAction, operation: string, payload: unknown, context: TaskContext): void => {
  if (operation === 'nickname') return assertNickname(action, payload, context);
  if (operation === 'exposure') return assertExposure(action, payload, context);
  if (operation === 'article-published') return assertPublished(action, payload, context);
  if (operation === 'article-modified') return assertModified(action, payload, context);
  if (operation === 'cafe-created') return assertCreated(action, payload, context);
  denyTaskScope();
};
