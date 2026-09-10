import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { schedulerTaskDependencies } from '@/shared/lib/agent-scheduler/task-dependencies';
import { Account } from '@/shared/models/account';
import { Cafe } from '@/shared/models/cafe';
import { AgentAction } from '@/shared/models/agent-action';
import { PublishedArticle } from '@/shared/models/published-article';

test('modified sync replays its receipt after the first sync removed the original article', async (t) => {
  const previous = { ...global.mongooseCache };
  const descriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
  global.mongooseCache!.conn = mongoose;
  t.after(() => { Object.assign(global.mongooseCache!, previous); if (descriptor) Object.defineProperty(mongoose.connection, 'readyState', descriptor); else Reflect.deleteProperty(mongoose.connection, 'readyState'); });
  t.mock.method(mongoose, 'connect', () => { throw new Error('network disabled'); });
  t.mock.method(mongoose.Query.prototype, 'exec', () => { throw new Error('unexpected database call'); });
  t.mock.method(Account, 'find', () => ({ sort: () => ({ lean: async () => [{ accountId: 'writer', password: 'test', role: 'writer' }] }) }));
  t.mock.method(Cafe, 'find', () => ({ sort: () => ({ lean: async () => [{ cafeId: '123', cafeUrl: 'cafe', menuId: '1', name: 'Cafe' }] }) }));
  let effectId = '';
  t.mock.method(AgentAction, 'updateOne', async (filter: Record<string, unknown>) => { effectId = Object.keys(filter).find((key) => key.startsWith('serviceEffects.'))!.split('.')[1]; return { modifiedCount: 0 }; });
  t.mock.method(AgentAction, 'findOne', () => ({ lean: async () => ({ serviceEffects: { [effectId]: { status: 'done', result: { ok: true } } } }) }));
  const original = t.mock.method(PublishedArticle, 'exists', async () => null);
  const result = await schedulerTaskDependencies.sync({
    kind: 'action', id: 'a'.repeat(64), dispatchId: 'b'.repeat(64), userId: 'owner', status: 'running', claimedBy: 'scheduler:worker:lease',
    action: { type: 'manual-modify', input: { cafeId: '123', manuscripts: [{ folderName: 'keyword', title: 'Title', htmlContent: 'Body', images: [] }] } },
  }, 'article-modified', { originalId: 'c'.repeat(24), articleId: 1, cafeId: '123', keyword: 'keyword', newTitle: 'Title', newContent: 'Body', modifiedBy: 'writer' });
  assert.deepEqual(result, { ok: true });
  assert.equal(original.mock.callCount(), 0);
});
