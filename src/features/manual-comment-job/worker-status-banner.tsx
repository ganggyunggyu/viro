'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2, MonitorCheck, MonitorX, PlugZap } from 'lucide-react';
import { cn } from '@/shared';
import type { CommentWorkerStatus } from './worker-status';
import { formatRelativeTime } from './manual-comment-job-ui-utils';

interface WorkerStatusBannerProps {
  status: CommentWorkerStatus | null;
}

/**
 * 댓글 작업은 로컬 워커(데스크톱 Viro)가 실제로 브라우저를 띄워야 진행된다.
 * 워커가 꺼진 줄 모르고 계속 등록하다 "왜 계속 대기지"로 시간을 버리는 일이 잦았어서,
 * 등록 버튼 바로 위에 연결 상태를 항상 띄운다.
 */
export const WorkerStatusBanner = ({ status }: WorkerStatusBannerProps) => {
  if (!status) {
    return (
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-lg border border-(--border-light) bg-(--surface-muted) px-4 py-3',
        )}
      >
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-(--ink-tertiary)" strokeWidth={2} />
        <p className={cn('text-sm text-(--ink-muted)')}>워커 상태 확인 중</p>
      </div>
    );
  }

  const onlineWorker = status.workers.find(({ isOnline }) => isOnline);
  const lastSeenWorker = status.workers.find(({ lastSeenAt }) => Boolean(lastSeenAt));

  if (status.isOnline) {
    return (
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-lg border border-(--success)/25 bg-(--success-soft) px-4 py-3',
        )}
      >
        <MonitorCheck className="h-4 w-4 shrink-0 text-(--success)" strokeWidth={2} />
        <p className={cn('min-w-0 flex-1 text-sm font-medium text-(--success)')}>
          워커 연결됨 — 등록하면 바로 처리됩니다
        </p>
        <span className={cn('shrink-0 text-xs text-(--success)/80')}>
          {onlineWorker?.label}
          {status.runningCount > 0 ? ` · 진행 중 ${status.runningCount}건` : ''}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'space-y-2 rounded-lg border border-(--danger)/25 bg-(--danger-soft) px-4 py-3',
      )}
    >
      <div className={cn('flex items-center gap-2.5')}>
        {status.hasPairedWorker ? (
          <MonitorX className="h-4 w-4 shrink-0 text-(--danger)" strokeWidth={2} />
        ) : (
          <PlugZap className="h-4 w-4 shrink-0 text-(--danger)" strokeWidth={2} />
        )}
        <p className={cn('min-w-0 flex-1 text-sm font-medium text-(--danger)')}>
          {status.hasPairedWorker
            ? '워커가 꺼져 있습니다 — 지금 등록하면 대기만 쌓입니다'
            : '연결된 워커가 없습니다 — 댓글 작업을 처리할 곳이 없습니다'}
        </p>
      </div>
      <p className={cn('pl-6.5 text-xs text-(--danger)/85')}>
        {status.hasPairedWorker
          ? `Viro 데스크톱 앱을 실행하고 시작을 눌러주세요${
            lastSeenWorker?.lastSeenAt ? ` (마지막 응답 ${formatRelativeTime(lastSeenWorker.lastSeenAt)})` : ''
          }`
          : 'Viro 데스크톱 앱을 설치하고 토큰을 연결해야 작업이 실행됩니다'}
        {status.pendingCount > 0 ? ` · 대기 중인 작업 ${status.pendingCount}건` : ''}
      </p>
      <Link
        href="/agent"
        className={cn('inline-block pl-6.5 text-xs font-medium text-(--danger) underline underline-offset-2')}
      >
        데스크톱 앱 설치·연결 안내
      </Link>
    </div>
  );
};
