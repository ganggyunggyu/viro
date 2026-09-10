import { connectDB } from '@/shared/lib/mongodb';
import { readTaskDoc, updateTaskDoc } from '@/shared/lib/agent-scheduler/task-model';
import { schedulerTaskFilter } from '@/shared/lib/agent-scheduler/task-store';
import type { SyncReceiptStore } from '@/shared/lib/agent-scheduler/sync-receipt';

export const syncReceiptStore: SyncReceiptStore = {
  begin: async (ref, key, effectId, cutoff) => {
    await connectDB();
    const result = await updateTaskDoc(ref.kind, { ...schedulerTaskFilter(ref), claimedBy: key, status: 'running', claimedAt: { $gte: cutoff }, [`serviceEffects.${effectId}`]: { $exists: false } }, { $set: { [`serviceEffects.${effectId}`]: { status: 'running' } } });
    return result.modifiedCount === 1;
  },
  read: async (ref, key, effectId) => {
    await connectDB();
    const row = await readTaskDoc(ref.kind, { ...schedulerTaskFilter(ref), claimedBy: key });
    return row?.serviceEffects?.[effectId] || null;
  },
  complete: async (ref, key, effectId, result) => {
    await connectDB();
    return (await updateTaskDoc(ref.kind, { ...schedulerTaskFilter(ref), claimedBy: key, status: 'running', [`serviceEffects.${effectId}.status`]: 'running' }, { $set: { [`serviceEffects.${effectId}`]: { status: 'done', result } } })).modifiedCount === 1;
  },
  uncertain: async (ref, key, effectId) => {
    await connectDB();
    await updateTaskDoc(ref.kind, { ...schedulerTaskFilter(ref), claimedBy: key, status: 'running', [`serviceEffects.${effectId}.status`]: 'running' }, { $set: { status: 'needs_review', [`serviceEffects.${effectId}`]: { status: 'uncertain' }, result: { success: false, error: '동기화 결과 확인이 필요합니다.' } } });
  },
};
