import assert from 'node:assert/strict';
import test from 'node:test';
import { AgentManagementError } from '@/shared/lib/agent-management/contract';
import type { SchedulerTask } from '@/shared/lib/agent-scheduler/task-contract';
import { assertTaskBrokerPayload, selectTaskContext } from '@/shared/lib/agent-scheduler/task-scope';
import type { ViroDesktopAction } from '@/shared/types/viro-desktop';

const accounts = [
  { accountId: 'writer', password: 'fake', role: 'writer' as const, nickname: '주인' },
  { accountId: 'commenter', password: 'fake', role: 'commenter' as const },
  { accountId: 'other-writer', password: 'fake', role: 'writer' as const, targetCafeIds: ['202'] },
  { accountId: 'inactive', password: 'fake', role: 'writer' as const, isActive: false },
  { accountId: 'excluded', password: 'fake', role: 'writer' as const, excludeFromAutoComment: true },
];
const cafes = [
  { cafeId: '101', cafeUrl: 'approved', name: '승인 카페', menuId: '1', categories: [], ownerAccountId: 'writer', categoryMenuIds: { 건강: '2' } },
  { cafeId: '202', cafeUrl: 'other', name: '다른 카페', menuId: '3', categories: [], ownerAccountId: 'other-writer', isDefault: true },
];
const context = { accounts, cafes };
const manuscript = { folderName: '원고', title: '제목', body: '', htmlContent: '<p>본문</p>', images: [], category: '건강' };
const taskFor = (action: ViroDesktopAction): SchedulerTask => ({ kind: 'action', id: 'a'.repeat(64), dispatchId: 'b'.repeat(64), userId: 'owner', status: 'running', action });
const publish = taskFor({ type: 'manual-publish', input: { cafeId: '101', manuscripts: [manuscript] } });
const modify = taskFor({ type: 'manual-modify', input: { cafeId: '101', manuscripts: [manuscript], daysLimit: 30, sortOrder: 'oldest' } });
const rewrite = taskFor({ type: 'rewrite', input: { cafeIds: ['101'], dateFrom: '2026-09-01', dateTo: '2026-09-07', keywordSource: 'custom', customKeywords: ['승인 키워드'] } });
const created = taskFor({ type: 'cafe-create', input: { ownerAccountId: 'writer', name: '새 카페', slug: 'newcafe', presetKey: 'health', description: '소개', keywords: ['건강'] } });
const publishedPayload = { cafeId: '101', articleId: 7, menuId: '2', keyword: manuscript.folderName, title: manuscript.title, content: manuscript.htmlContent, writerAccountId: 'writer', articleUrl: 'https://cafe.naver.com/ca-fe/cafes/101/articles/7' };
const modifiedPayload = { cafeId: '101', articleId: 7, originalId: 'c'.repeat(24), keyword: manuscript.folderName, newTitle: manuscript.title, newContent: manuscript.htmlContent, modifiedBy: 'writer' };
const createdPayload = { cafeId: '303', cafeUrl: 'https://cafe.naver.com/newcafe', name: '새 카페', ownerAccountId: 'writer', ownerNickname: '주인', presetKey: 'health', slug: 'newcafe' };
const rewriteRow = { cafeId: '101', cafeName: '승인 카페', articleId: 7, subject: '원문', service: '일반', keyword: '승인 키워드', writerAccountId: 'writer' };
const forbidden = (run: () => unknown): void => assert.throws(run, (error: unknown) => error instanceof AgentManagementError && error.status === 403 && error.code === 'task_scope_denied' && error.message === '작업에서 승인한 범위를 벗어났습니다');
const check = (task: SchedulerTask, verb: 'sync' | 'prepare', operation: string, payload: Record<string, unknown>): void => assertTaskBrokerPayload(task, verb, operation, payload, context);

test('operation receives exactly its account and cafe without mutating owner context', () => {
  const operation: SchedulerTask = { ...taskFor({ type: 'account-login', accountId: 'writer' }), kind: 'operation', operation: { type: 'join_cafe', accountId: 'commenter', cafeId: '101' } };
  assert.deepEqual(selectTaskContext(operation, context), { accounts: [accounts[1]], cafes: [cafes[0]] });
  assert.equal(context.accounts.length, 5);
});

test('login and creation do not disclose unrelated cafe or account credentials', () => {
  for (const task of [created, taskFor({ type: 'account-login', accountId: 'writer' })]) assert.deepEqual(selectTaskContext(task, context), { accounts: [accounts[0]], cafes: [] });
});

test('nickname and join-all retain only resources required by their approved mode', () => {
  assert.deepEqual(selectTaskContext(taskFor({ type: 'nickname-change', mode: 'by-account', accountId: 'commenter' }), context), { accounts: [accounts[1]], cafes });
  assert.deepEqual(selectTaskContext(taskFor({ type: 'nickname-change', mode: 'by-cafe', cafeId: '101' }), context), { accounts, cafes: [cafes[0]] });
  for (const action of [{ type: 'cafe-join-all' }, { type: 'nickname-change', mode: 'all' }] as ViroDesktopAction[]) assert.deepEqual(selectTaskContext(taskFor(action), context), context);
});

test('publishing selects eligible writers, modify selects owner accounts, rewrite selects cafe owners', () => {
  assert.deepEqual(selectTaskContext(publish, context), { accounts: [accounts[0]], cafes: [cafes[0]] });
  assert.deepEqual(selectTaskContext(modify, context), { accounts, cafes: [cafes[0]] });
  assert.deepEqual(selectTaskContext(rewrite, context), { accounts: [accounts[0]], cafes: [cafes[0]] });
});

test('exposure selects exact account and cafe and absent resources never fall back to owner pool', () => {
  const exposure = taskFor({ type: 'exposure-check', accountId: 'commenter', items: [{ cafeId: '101', keyword: '키워드' }] });
  assert.deepEqual(selectTaskContext(exposure, context), { accounts: [accounts[1]], cafes: [cafes[0]] });
  assert.deepEqual(selectTaskContext(taskFor({ type: 'account-login', accountId: 'foreign' }), context), { accounts: [], cafes: [] });
});

test('nickname sync is restricted to approved action and account without extra resource fields', () => {
  const nickname = taskFor({ type: 'nickname-change', mode: 'by-account', accountId: 'writer' });
  check(nickname, 'sync', 'nickname', { accountId: 'writer', nickname: '새이름' });
  check(taskFor({ type: 'cafe-join-all' }), 'sync', 'nickname', { accountId: 'commenter', nickname: '새이름' });
  for (const payload of [{ accountId: 'commenter', nickname: '새이름' }, { accountId: 'writer', nickname: '새이름', userId: 'foreign' }, { accountId: 'writer', nickname: '' }]) forbidden(() => check(nickname, 'sync', 'nickname', payload));
  forbidden(() => check(publish, 'sync', 'nickname', { accountId: 'writer', nickname: '새이름' }));
});

test('exposure sync matches the complete approved cafe article keyword tuple', () => {
  const task = taskFor({ type: 'exposure-check', accountId: 'writer', items: [{ cafeId: '101', articleId: 7, keyword: '승인' }] });
  const payload = { cafeId: '101', articleId: 7, keyword: '승인', status: '노출', rank: 2 };
  check(task, 'sync', 'exposure', payload);
  check(task, 'sync', 'exposure', { ...payload, cafeName: '승인 카페', foundTitle: '검색 결과 제목', foundLink: 'https://cafe.naver.com/approved/7' });
  for (const change of [{ cafeId: '202' }, { articleId: 8 }, { articleId: undefined }, { keyword: '변경' }, { status: 'fake' }, { rank: -1 }, { writerAccountId: 'foreign' }]) forbidden(() => check(task, 'sync', 'exposure', { ...payload, ...change }));
  forbidden(() => check(modify, 'sync', 'exposure', payload));
});

test('article-published sync permits only approved manuscript, cafe, menu and eligible writer', () => {
  check(publish, 'sync', 'article-published', publishedPayload);
  for (const change of [{ cafeId: '202' }, { writerAccountId: 'commenter' }, { writerAccountId: 'inactive' }, { writerAccountId: 'excluded' }, { writerAccountId: 'other-writer' }, { title: '다른 원고' }, { content: '다른 본문' }, { keyword: '다른 키워드' }, { menuId: '999' }, { articleId: 0 }, { articleUrl: 'https://evil.example/7' }, { articleUrl: 'https://cafe.naver.com/other/7' }, { ownerAccountId: 'foreign' }]) forbidden(() => check(publish, 'sync', 'article-published', { ...publishedPayload, ...change }));
  forbidden(() => check(modify, 'sync', 'article-published', publishedPayload));
});

test('article-modified sync binds allowed account/cafe and approved manuscript', () => {
  check(modify, 'sync', 'article-modified', modifiedPayload);
  for (const change of [{ cafeId: '202' }, { modifiedBy: 'foreign' }, { originalId: 'bad' }, { articleId: -1 }, { newTitle: '다른 원고' }, { newContent: '다른 본문' }, { keyword: '다른 키워드' }]) forbidden(() => check(modify, 'sync', 'article-modified', { ...modifiedPayload, ...change }));
  forbidden(() => check(rewrite, 'sync', 'article-modified', modifiedPayload));
});

test('cafe-created sync binds identity and preset and validates newly created Naver URL', () => {
  check(created, 'sync', 'cafe-created', createdPayload);
  check(created, 'sync', 'cafe-created', { ...createdPayload, cafeUrl: 'https://cafe.naver.com/newcafe/' });
  for (const change of [{ ownerAccountId: 'commenter' }, { presetKey: 'other' }, { name: '다른 이름' }, { slug: 'other' }, { cafeId: 'abc' }, { cafeId: '0' }, { cafeUrl: 'http://cafe.naver.com/newcafe' }, { cafeUrl: 'https://cafe.naver.com.evil.example/newcafe' }, { cafeUrl: 'https://cafe.naver.com/other' }, { cafeUrl: 'https://cafe.naver.com/newcafe?other=1' }, { accountId: 'foreign' }]) forbidden(() => check(created, 'sync', 'cafe-created', { ...createdPayload, ...change }));
  forbidden(() => check(publish, 'sync', 'cafe-created', createdPayload));
});

test('manual-modify prepare cannot expand approved cafe count period or ordering', () => {
  const payload = { cafeId: '101', count: 1, daysLimit: 30, sortOrder: 'oldest' };
  check(modify, 'prepare', 'manual-modify', payload);
  for (const change of [{ cafeId: '202' }, { count: 2 }, { count: 0 }, { count: 1.5 }, { daysLimit: 365 }, { daysLimit: undefined }, { sortOrder: 'random' }, { writerAccountId: 'foreign' }]) forbidden(() => check(modify, 'prepare', 'manual-modify', { ...payload, ...change }));
  forbidden(() => check(publish, 'prepare', 'manual-modify', payload));
});

test('rewrite prepare allows only approved cafe owner and custom keywords', () => {
  check(rewrite, 'prepare', 'rewrite-content', { tasks: [rewriteRow] });
  for (const change of [{ cafeId: '202' }, { writerAccountId: 'commenter' }, { writerAccountId: 'foreign' }, { cafeName: '다른 카페' }, { keyword: '다른 키워드' }, { articleId: 0 }, { accountId: 'foreign' }]) forbidden(() => check(rewrite, 'prepare', 'rewrite-content', { tasks: [{ ...rewriteRow, ...change }] }));
  forbidden(() => check(modify, 'prepare', 'rewrite-content', { tasks: [rewriteRow] }));
});

test('rewrite prepare bounds batches and rejects duplicate article targets', () => {
  const pool = taskFor({ type: 'rewrite', input: { cafeIds: ['101'], dateFrom: '2026-09-01', dateTo: '2026-09-07', keywordSource: 'pool' } });
  const rows = Array.from({ length: 100 }, (_, index) => ({ ...rewriteRow, articleId: index + 2 }));
  check(pool, 'prepare', 'rewrite-content', { tasks: rows });
  for (const tasks of [[], [...rows, { ...rewriteRow, articleId: 102 }], [rewriteRow, rewriteRow], [null]]) forbidden(() => check(pool, 'prepare', 'rewrite-content', { tasks }));
});

test('unknown operations, wrong verbs, dynamic writes and malformed payloads are denied', () => {
  for (const task of [publish, modify, rewrite, created]) {
    for (const operation of ['post-content', 'comment-job', 'nickname', 'unknown']) forbidden(() => check(task, 'prepare', operation, {}));
    forbidden(() => check(task, 'sync', 'manual-modify', {}));
  }
  for (const payload of [null, [], 'payload']) forbidden(() => assertTaskBrokerPayload(publish, 'sync', 'article-published', payload as unknown as Record<string, unknown>, context));
});
