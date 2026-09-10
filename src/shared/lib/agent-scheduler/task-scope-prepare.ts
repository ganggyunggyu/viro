import type { ViroDesktopAction } from '@/shared/types/viro-desktop';
import {
  denyTaskScope, hasTaskAccount, isArticleId, isDocumentId, isScopeText,
  requireTaskScope, scopeObject, taskCafe, type TaskContext,
} from '@/shared/lib/agent-scheduler/task-scope-payload';

const assertManualModify = (action: ViroDesktopAction, payload: unknown, context: TaskContext): void => {
  requireTaskScope(action.type === 'manual-modify');
  const body = scopeObject(payload, ['cafeId', 'count', 'daysLimit', 'sortOrder']);
  taskCafe(context, body.cafeId);
  requireTaskScope(body.cafeId === action.input.cafeId);
  requireTaskScope(isArticleId(body.count) && body.count <= Math.min(100, action.input.manuscripts.length));
  requireTaskScope(body.daysLimit === action.input.daysLimit && (body.sortOrder ?? 'oldest') === (action.input.sortOrder ?? 'oldest'));
};
const assertRewrite = (action: ViroDesktopAction, payload: unknown, context: TaskContext): void => {
  requireTaskScope(action.type === 'rewrite');
  const body = scopeObject(payload, ['tasks']);
  requireTaskScope(Array.isArray(body.tasks) && body.tasks.length > 0 && body.tasks.length <= 100);
  const keywords = (action.input.customKeywords || []).map((value) => value.trim()).filter(Boolean);
  requireTaskScope(action.input.keywordSource !== 'custom' || body.tasks.length <= keywords.length);
  const seen = new Set<string>();
  body.tasks.forEach((row: unknown, index: number) => {
    const item = scopeObject(row, ['originalId', 'cafeId', 'cafeName', 'articleId', 'subject', 'service', 'keyword', 'writerAccountId']);
    const cafe = taskCafe(context, item.cafeId);
    requireTaskScope(action.input.cafeIds.includes(cafe.cafeId) && item.cafeName === cafe.name);
    requireTaskScope(item.writerAccountId === cafe.ownerAccountId && hasTaskAccount(context, item.writerAccountId));
    requireTaskScope(isArticleId(item.articleId) && item.articleId !== 1);
    requireTaskScope(item.originalId === undefined || isDocumentId(item.originalId));
    requireTaskScope(isScopeText(item.subject, 1000) && isScopeText(item.service, 100));
    requireTaskScope(item.keyword === undefined || isScopeText(item.keyword, 200));
    requireTaskScope(action.input.keywordSource !== 'custom' || item.keyword === keywords[index]);
    const key = `${cafe.cafeId}:${item.articleId}`;
    requireTaskScope(!seen.has(key));
    seen.add(key);
  });
};

export const assertTaskPrepare = (action: ViroDesktopAction, operation: string, payload: unknown, context: TaskContext): void => {
  if (operation === 'manual-modify') return assertManualModify(action, payload, context);
  if (operation === 'rewrite-content') return assertRewrite(action, payload, context);
  denyTaskScope();
};
