import { Account } from '@/shared/models/account';
import { Cafe } from '@/shared/models/cafe';
import { PublishedArticle } from '@/shared/models/published-article';
import { connectDB } from '@/shared/lib/mongodb';
import { schedulerTaskStore } from '@/shared/lib/agent-scheduler/task-store';
import { selectTaskContext, assertTaskBrokerPayload } from '@/shared/lib/agent-scheduler/task-scope';
import { runSyncReceipt } from '@/shared/lib/agent-scheduler/sync-receipt';
import { syncReceiptStore } from '@/shared/lib/agent-scheduler/sync-receipt-store';
import { taskError, type SchedulerTask } from '@/shared/lib/agent-scheduler/task-contract';
import type { SchedulerTaskDependencies } from '@/shared/lib/agent-scheduler/task-service';
import { forwardTaskCaptcha } from '@/shared/lib/agent-scheduler/captcha-forward';

const loadTaskContext = async (task: SchedulerTask) => {
  await connectDB();
  const [accounts, cafes] = await Promise.all([
    Account.find({ userId: task.userId, isActive: true }).sort({ isMain: -1, createdAt: 1 }).lean(),
    Cafe.find({ userId: task.userId, isActive: true }).sort({ isDefault: -1, createdAt: 1 }).lean(),
  ]);
  return selectTaskContext(task, {
    accounts: accounts.map(({ accountId, password, nickname, isMain, role, excludeFromAutoComment, targetCafeIds }) => ({ accountId, password, nickname, isMain, role, excludeFromAutoComment, targetCafeIds })),
    cafes: cafes.map(({ cafeId, cafeUrl, menuId, name, categories, isDefault, categoryMenuIds, categoryAliases, ownerAccountId }) => ({ cafeId, cafeUrl, menuId, name, categories, isDefault, categoryMenuIds: categoryMenuIds instanceof Map ? Object.fromEntries(categoryMenuIds) : categoryMenuIds, categoryAliases: categoryAliases instanceof Map ? Object.fromEntries(categoryAliases) : categoryAliases, ownerAccountId })),
  });
};

export const schedulerTaskDependencies: SchedulerTaskDependencies = {
  store: schedulerTaskStore,
  context: loadTaskContext,
  captcha: forwardTaskCaptcha,
  sync: async (task, operation, payload) => {
    const context = await loadTaskContext(task);
    assertTaskBrokerPayload(task, 'sync', operation, payload, context);
    return runSyncReceipt(syncReceiptStore, task, task.claimedBy!, operation, payload, async () => {
      if (operation === 'article-modified' && !await PublishedArticle.exists({ _id: String(payload.originalId), cafeId: String(payload.cafeId), articleId: Number(payload.articleId), writerAccountId: String(payload.modifiedBy) })) return taskError('task_scope_denied', 403);
      const { syncBrokerTask } = await import('@/shared/lib/agent-scheduler/broker-sync');
      const result = await syncBrokerTask(task.userId, operation, payload);
      if (!result) return taskError('task_scope_denied', 403);
      return result;
    });
  },
  prepare: async (task, operation, payload) => {
    const context = await loadTaskContext(task);
    assertTaskBrokerPayload(task, 'prepare', operation, payload, context);
    const { prepareBrokerTask } = await import('@/shared/lib/agent-scheduler/broker-prepare');
    const result = await prepareBrokerTask(task.userId, operation, payload);
    if (operation === 'manual-modify' && Array.isArray(result.articles)) {
      result.articles = result.articles.filter((article: { writerAccountId: string }) => context.accounts.some(({ accountId }) => accountId === article.writerAccountId));
    }
    return result;
  },
};
