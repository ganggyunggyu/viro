'use client';

import { useState, useEffect, useCallback, use } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  MessageSquare,
  Reply,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared';
import { PageLayout } from '@/widgets';
import {
  Badge,
  type BadgeVariant,
  Button,
  Card,
  EmptyState,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/shared';
import Link from 'next/link';
import {
  getDetailedJobs,
  type JobDetail,
  type JobsPage,
  type JobsFilter,
} from '@/entities/queue';
import { getAccountInfoAction, type AccountInfo } from './actions';

const STATUS_LABELS: Record<string, string> = {
  delayed: '예약',
  waiting: '대기',
  active: '진행',
  completed: '완료',
  failed: '실패',
};

const TYPE_LABELS: Record<string, string> = {
  post: '글',
  comment: '댓글',
  reply: '대댓글',
};

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  delayed: 'info',
  waiting: 'neutral',
  active: 'warning',
  completed: 'success',
  failed: 'danger',
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  post: FileText,
  comment: MessageSquare,
  reply: Reply,
};

const formatDelay = (ms: number): string => {
  if (ms < 60000) return `${Math.round(ms / 1000)}초`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}분`;
  return `${Math.round(ms / 3600000)}시간`;
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const workerIdToAccountId = (workerId: string): string => {
  return workerId.replace(/^task_/, '');
};

interface Props {
  params: Promise<{ workerId: string }>;
}

export default function WorkerQueuePage({ params }: Props) {
  const { workerId } = use(params);
  const accountId = workerIdToAccountId(workerId);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [jobsData, setJobsData] = useState<JobsPage | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [filter, setFilter] = useState<JobsFilter>({ status: 'all', type: 'all', accountId });
  const [isPolling, setIsPolling] = useState(true);

  const loadData = useCallback(async () => {
    const [jobsResult, accountResult] = await Promise.all([
      getDetailedJobs({ ...filter, accountId }, page, pageSize),
      getAccountInfoAction(accountId),
    ]);
    setJobsData(jobsResult);
    setAccountInfo(accountResult);
  }, [filter, accountId, page, pageSize]);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      loadData();
    }, 0);

    if (!isPolling) {
      return () => clearTimeout(initialTimer);
    }

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [loadData, isPolling]);

  const handleFilterChange = (key: keyof JobsFilter, value: string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const statusCounts = jobsData?.jobs.reduce(
    (acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  return (
    <PageLayout
      title={`${accountInfo?.nickname || accountId} 큐`}
      subtitle={`Worker: ${workerId}`}
    >
      <div className={cn('space-y-6')}>
        {/* 뒤로가기 */}
        <Link
          href="/queue"
          className={cn('inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink')}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          전체 큐 대시보드
        </Link>

        {/* 계정 정보 카드 */}
        {accountInfo && (
          <Card padding="lg">
            <div className={cn('flex items-start justify-between')}>
              <div>
                <h2 className={cn('text-xl font-bold text-ink')}>
                  {accountInfo.nickname || accountId}
                </h2>
                <p className={cn('text-sm text-ink-muted mt-1 font-mono')}>
                  계정 ID: {accountId}
                </p>
              </div>
              <div className={cn('flex items-center gap-2')}>
                <Button
                  variant={isPolling ? 'teal' : 'ghost'}
                  size="sm"
                  onClick={() => setIsPolling((p) => !p)}
                >
                  {isPolling ? '자동 새로고침' : '새로고침 중지'}
                </Button>
              </div>
            </div>

            <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6')}>
              <div className={cn('rounded-xl bg-surface-muted p-4')}>
                <div className={cn('text-xs text-ink-muted mb-1')}>역할</div>
                <div className={cn('font-semibold text-ink')}>
                  {accountInfo.isMain ? '메인 계정' : '댓글 계정'}
                </div>
              </div>
              <div className={cn('rounded-xl bg-surface-muted p-4')}>
                <div className={cn('text-xs text-ink-muted mb-1')}>페르소나</div>
                <div className={cn('font-semibold text-ink')}>
                  {accountInfo.personaId || '없음'}
                </div>
              </div>
              <div className={cn('rounded-xl bg-surface-muted p-4')}>
                <div className={cn('text-xs text-ink-muted mb-1')}>일일 제한</div>
                <div className={cn('font-semibold text-ink')}>
                  {accountInfo.dailyPostLimit || '무제한'}
                </div>
              </div>
              <div className={cn('rounded-xl bg-surface-muted p-4')}>
                <div className={cn('text-xs text-ink-muted mb-1')}>활동 시간</div>
                <div className={cn('font-semibold text-ink text-sm')}>
                  {accountInfo.activityHours
                    ? `${accountInfo.activityHours.start}시~${accountInfo.activityHours.end}시`
                    : '제한 없음'}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 작업 현황 요약 */}
        <Card padding="lg">
          <h3 className={cn('text-sm font-medium text-ink-muted mb-4')}>작업 현황</h3>
          <div className={cn('flex flex-wrap gap-2')}>
            {(['delayed', 'waiting', 'active', 'completed', 'failed'] as const).map((status) => (
              <Badge key={status} variant={STATUS_BADGE_VARIANT[status]} mono>
                {statusCounts[status] || 0} {STATUS_LABELS[status]}
              </Badge>
            ))}
          </div>
        </Card>

        {/* 필터 */}
        <Card padding="md" className={cn('flex flex-wrap gap-4 items-center')}>
          <Select
            label="상태"
            value={filter.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[
              { value: 'all', label: '전체' },
              { value: 'delayed', label: '예약' },
              { value: 'waiting', label: '대기' },
              { value: 'active', label: '진행' },
              { value: 'completed', label: '완료' },
              { value: 'failed', label: '실패' },
            ]}
            fullWidth={false}
            className="w-28"
          />

          <Select
            label="타입"
            value={filter.type || 'all'}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            options={[
              { value: 'all', label: '전체' },
              { value: 'post', label: '글' },
              { value: 'comment', label: '댓글' },
              { value: 'reply', label: '대댓글' },
            ]}
            fullWidth={false}
            className="w-28"
          />

          {jobsData && (
            <div className={cn('ml-auto font-mono text-sm text-ink-muted')}>
              총 {jobsData.total}건
            </div>
          )}
        </Card>

        {/* Jobs 테이블 */}
        <Table>
          <TableHead>
            <tr>
              <TableCell header density="dense">상태</TableCell>
              <TableCell header density="dense">타입</TableCell>
              <TableCell header density="dense">카페</TableCell>
              <TableCell header density="dense">내용</TableCell>
              <TableCell header density="dense">예정/시간</TableCell>
            </tr>
          </TableHead>
          <TableBody>
            {jobsData?.jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
            {(!jobsData || jobsData.jobs.length === 0) && (
              <tr>
                <td colSpan={5}>
                  <EmptyState title={!jobsData ? '로딩 중...' : '작업이 없습니다'} />
                </td>
              </tr>
            )}
          </TableBody>
        </Table>

        {/* 페이지네이션 */}
        {jobsData && jobsData.totalPages > 1 && (
          <div className={cn('flex items-center justify-between')}>
            <div className={cn('font-mono text-sm text-ink-muted')}>
              {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, jobsData.total)} / {jobsData.total}
            </div>
            <div className={cn('flex gap-1')}>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setPage(1)}
                disabled={page === 1}
                aria-label="첫 페이지"
              >
                <ChevronsLeft className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="이전 페이지"
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
              {Array.from({ length: Math.min(5, jobsData.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, jobsData.totalPages - 4)) + i;
                if (pageNum > jobsData.totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'primary' : 'ghost'}
                    size="xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setPage((p) => Math.min(jobsData.totalPages, p + 1))}
                disabled={page === jobsData.totalPages}
                aria-label="다음 페이지"
              >
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setPage(jobsData.totalPages)}
                disabled={page === jobsData.totalPages}
                aria-label="마지막 페이지"
              >
                <ChevronsRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

const JobRow = ({ job }: { job: JobDetail }) => {
  const TypeIcon = TYPE_ICONS[job.type];

  const getContentDisplay = () => {
    if (job.type === 'post') {
      return (
        <div>
          <div className={cn('font-medium text-ink truncate max-w-[200px]')}>
            {job.subject || job.keyword || '-'}
          </div>
          {job.keyword && job.subject && (
            <div className={cn('text-xs text-ink-muted')}>키워드: {job.keyword}</div>
          )}
        </div>
      );
    }
    return (
      <div>
        <div className={cn('text-ink truncate max-w-[200px]')} title={job.content}>
          {job.content || '-'}
        </div>
        <div className={cn('font-mono text-xs text-ink-muted')}>
          #{job.articleId}
          {job.type === 'reply' && ` (댓글 ${job.commentIndex})`}
        </div>
      </div>
    );
  };

  const getTimeDisplay = () => {
    if (job.status === 'delayed' && job.delay) {
      return (
        <div className={cn('font-mono text-info font-medium')}>
          {formatDelay(job.delay)} 후
        </div>
      );
    }
    if (job.status === 'active') {
      return <div className={cn('text-warning')}>처리중...</div>;
    }
    if (job.finishedOn) {
      return <div className={cn('font-mono text-ink-muted')}>{formatTime(job.finishedOn)}</div>;
    }
    return <div className={cn('font-mono text-ink-muted')}>{formatTime(job.createdAt)}</div>;
  };

  return (
    <TableRow>
      <TableCell density="dense">
        <Badge variant={STATUS_BADGE_VARIANT[job.status]}>{STATUS_LABELS[job.status]}</Badge>
      </TableCell>
      <TableCell density="dense">
        <Badge variant="neutral">
          <TypeIcon className="h-3 w-3" strokeWidth={2} />
          {TYPE_LABELS[job.type]}
        </Badge>
      </TableCell>
      <TableCell density="dense">
        <span className={cn('truncate max-w-[120px] block text-ink')} title={job.cafeName}>
          {job.cafeName || job.cafeId}
        </span>
      </TableCell>
      <TableCell density="dense">{getContentDisplay()}</TableCell>
      <TableCell density="dense">{getTimeDisplay()}</TableCell>
    </TableRow>
  );
};
