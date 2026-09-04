/**
 * 댓글 작업 조회/취소. 서버 액션(actions.ts)은 세션에서 userId 를 꺼내지만
 * 에이전트 API 는 토큰에서 꺼내므로 여기서는 userId 를 인자로 받는다.
 */
import { connectDB } from '@/shared/lib/mongodb';
import { ManualCommentJob, type IManualCommentJob } from '@/shared/models';
import type { ManualCommentJobStatus } from '@/shared/models';
import { toView, type ManualCommentJobView } from './job-view';

export const JOB_LIST_MAX_LIMIT = 100;
export const JOB_LIST_DEFAULT_LIMIT = 50;

/** 워커가 이미 손을 뗐거나 뗄 수 없는 상태. 취소해도 바꿀 것이 없다. */
const CANCELLABLE_STATUSES: readonly ManualCommentJobStatus[] = ['pending'];

export const clampJobLimit = (raw: unknown): number => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return JOB_LIST_DEFAULT_LIMIT;
  return Math.min(Math.floor(parsed), JOB_LIST_MAX_LIMIT);
};

export const isJobStatus = (value: unknown): value is ManualCommentJobStatus =>
  value === 'pending' ||
  value === 'running' ||
  value === 'done' ||
  value === 'failed' ||
  value === 'cancelled';

export interface ListManualCommentJobsOptions {
  status?: string;
  cafeId?: string;
  limit?: unknown;
}

export const buildJobListFilter = (
  userId: string,
  { status, cafeId }: ListManualCommentJobsOptions = {},
): Record<string, unknown> => {
  const filter: Record<string, unknown> = { userId };
  if (isJobStatus(status)) filter.status = status;
  if (cafeId?.trim()) filter.cafeId = cafeId.trim();
  return filter;
};

export const listManualCommentJobs = async (
  userId: string,
  options: ListManualCommentJobsOptions = {},
): Promise<ManualCommentJobView[]> => {
  await connectDB();
  const docs = await ManualCommentJob.find(buildJobListFilter(userId, options))
    .sort({ createdAt: -1 })
    .limit(clampJobLimit(options.limit))
    .lean<IManualCommentJob[]>();
  return docs.map(toView);
};

export const getManualCommentJob = async (
  userId: string,
  jobId: string,
): Promise<ManualCommentJobView | null> => {
  await connectDB();
  // userId 를 조건에 같이 넣는다. 찾은 뒤에 비교하면 남의 잡이 존재한다는 사실이 새어나간다.
  const doc = await ManualCommentJob.findOne({ _id: jobId, userId }).lean<IManualCommentJob>();
  return doc ? toView(doc) : null;
};

export type CancelJobResult =
  | { ok: true; job: ManualCommentJobView }
  | { ok: false; reason: 'not-found' | 'not-cancellable'; status?: ManualCommentJobStatus };

export const cancelManualCommentJob = async (
  userId: string,
  jobId: string,
): Promise<CancelJobResult> => {
  await connectDB();

  // pending 인 동안에만 바꾼다. 워커가 그 사이 집어가면 조건이 안 맞아 null 이 오고,
  // 그때는 이미 돌고 있는 것이므로 취소가 아니라 실패로 답한다.
  const updated = await ManualCommentJob.findOneAndUpdate(
    { _id: jobId, userId, status: { $in: CANCELLABLE_STATUSES } },
    { $set: { status: 'cancelled' } },
    { new: true },
  ).lean<IManualCommentJob>();

  if (updated) return { ok: true, job: toView(updated) };

  const existing = await ManualCommentJob.findOne({ _id: jobId, userId })
    .lean<IManualCommentJob>();
  if (!existing) return { ok: false, reason: 'not-found' };
  return { ok: false, reason: 'not-cancellable', status: existing.status };
};
