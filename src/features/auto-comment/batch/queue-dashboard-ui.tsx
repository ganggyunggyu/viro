'use client';

import { useCallback, useState, useEffect, useTransition } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Link2,
  MessageSquare,
  Reply,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared';
import {
  Badge,
  type BadgeVariant,
  Button,
  Card,
  ConfirmModal,
  Drawer,
  EmptyState,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/shared';
import {
  getDetailedJobs,
  getQueueSummary,
  clearAllQueues,
  removeJob,
  getRelatedJobs,
  type JobDetail,
  type JobsPage,
  type JobsFilter,
  type QueueSummary,
} from '@/entities/queue';
import { getAccountsAction, getCafesAction, type AccountData, type CafeData } from '@/features/accounts/actions';

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

const STATUS_ORDER = ['delayed', 'waiting', 'active', 'completed', 'failed'] as const;

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
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

  const time = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (diffDays === 0) return time;
  if (diffDays === 1) return `어제 ${time}`;
  if (diffDays <= 7) return `${diffDays}일전 ${time}`;
  return `${date.getMonth() + 1}/${date.getDate()} ${time}`;
};

interface QueueDashboardUIProps {
  onClose?: () => void;
}

export const QueueDashboardUI = ({ onClose }: QueueDashboardUIProps) => {
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [jobsData, setJobsData] = useState<JobsPage | null>(null);
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [filter, setFilter] = useState<JobsFilter>({ status: 'all', type: 'all' });
  const [isPolling, setIsPolling] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [cafes, setCafes] = useState<CafeData[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<{ accountId: string; jobId: string; content: string } | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<{ articleId: number; jobs: JobDetail[] } | null>(null);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [detailJob, setDetailJob] = useState<JobDetail | null>(null);

  const loadData = useCallback(async () => {
    const [jobsResult, summaryResult, accountsData, cafesData] = await Promise.all([
      getDetailedJobs(filter, page, pageSize),
      getQueueSummary(),
      getAccountsAction(),
      getCafesAction(),
    ]);
    setJobsData(jobsResult);
    setSummary(summaryResult);
    setAccounts(accountsData);
    setCafes(cafesData);
  }, [filter, page, pageSize]);

  const handleDeleteJob = async () => {
    if (!showDeleteModal) return;
    startTransition(async () => {
      await removeJob(showDeleteModal.accountId, showDeleteModal.jobId);
      setShowDeleteModal(null);
      loadData();
    });
  };

  const handleViewRelated = async (articleId: number) => {
    setIsLoadingRelated(true);
    const jobs = await getRelatedJobs(articleId);
    setRelatedJobs({ articleId, jobs });
    setIsLoadingRelated(false);
  };

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
  }, [filter, page, isPolling, loadData]);

  const handleClearAll = () => {
    startTransition(async () => {
      await clearAllQueues();
      setShowClearModal(false);
      loadData();
    });
  };

  const handleFilterChange = (key: keyof JobsFilter, value: string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const totalPending = summary
    ? summary.total.delayed + summary.total.waiting + summary.total.active
    : 0;

  const filteredJobs = (jobsData?.jobs || []).filter((job) => {
    if (!searchKeyword.trim()) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      job.keyword?.toLowerCase().includes(keyword) ||
      job.subject?.toLowerCase().includes(keyword) ||
      job.content?.toLowerCase().includes(keyword) ||
      job.accountId.toLowerCase().includes(keyword) ||
      job.cafeName?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className={cn('space-y-6')}>
      {/* 전체 클리어 확인 모달 */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearAll}
        title="모든 큐를 클리어하시겠습니까?"
        description={`대기 중인 작업 ${totalPending}건이 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
        variant="danger"
        confirmText="전체 클리어"
        cancelText="취소"
        isLoading={isPending}
      />

      {/* 개별 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={handleDeleteJob}
        title="이 작업을 삭제하시겠습니까?"
        description={showDeleteModal ? `"${showDeleteModal.content}" 작업이 삭제됩니다.` : ''}
        variant="danger"
        confirmText="삭제"
        cancelText="취소"
        isLoading={isPending}
      />

      {/* 연관 작업 드로어 */}
      <Drawer
        isOpen={!!relatedJobs}
        onClose={() => setRelatedJobs(null)}
        title="연관 작업"
        description={relatedJobs ? `글 #${relatedJobs.articleId}의 댓글/대댓글` : undefined}
      >
        {relatedJobs && relatedJobs.jobs.length === 0 ? (
          <EmptyState title="연관된 댓글/대댓글이 없습니다" />
        ) : (
          <div className={cn('space-y-2')}>
            {relatedJobs?.jobs.map((job) => (
              <div key={job.id} className={cn('rounded-xl border border-(--border-light) bg-(--surface-muted) p-3')}>
                <div className={cn('mb-2 flex items-center gap-2')}>
                  <Badge variant={STATUS_BADGE_VARIANT[job.status]}>{STATUS_LABELS[job.status]}</Badge>
                  <Badge variant="neutral">{TYPE_LABELS[job.type]}</Badge>
                  <span className={cn('font-mono text-xs text-(--ink-muted)')}>{job.accountId}</span>
                </div>
                <p className={cn('truncate text-sm text-(--ink)')}>{job.content || '-'}</p>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      {/* 작업 상세 드로어 */}
      <Drawer
        isOpen={!!detailJob}
        onClose={() => setDetailJob(null)}
        title="작업 상세"
        description={detailJob ? `#${detailJob.id}` : undefined}
      >
        {detailJob && (
          <div className={cn('space-y-4 text-sm')}>
            <div className={cn('flex items-center gap-2')}>
              <Badge variant={STATUS_BADGE_VARIANT[detailJob.status]}>{STATUS_LABELS[detailJob.status]}</Badge>
              <Badge variant="neutral">{TYPE_LABELS[detailJob.type]}</Badge>
            </div>

            <dl className={cn('space-y-3')}>
              <div>
                <dt className={cn('text-xs font-medium text-(--ink-muted)')}>계정</dt>
                <dd className={cn('font-mono text-(--ink)')}>{detailJob.accountId}</dd>
              </div>
              <div>
                <dt className={cn('text-xs font-medium text-(--ink-muted)')}>카페</dt>
                <dd className={cn('text-(--ink)')}>{detailJob.cafeName || detailJob.cafeId}</dd>
              </div>
              {(detailJob.subject || detailJob.keyword) && (
                <div>
                  <dt className={cn('text-xs font-medium text-(--ink-muted)')}>제목/키워드</dt>
                  <dd className={cn('text-(--ink)')}>{detailJob.subject || detailJob.keyword}</dd>
                </div>
              )}
              {detailJob.content && (
                <div>
                  <dt className={cn('text-xs font-medium text-(--ink-muted)')}>내용</dt>
                  <dd className={cn('whitespace-pre-wrap text-(--ink)')}>{detailJob.content}</dd>
                </div>
              )}
              <div>
                <dt className={cn('text-xs font-medium text-(--ink-muted)')}>생성 시각</dt>
                <dd className={cn('font-mono text-(--ink)')}>{formatTime(detailJob.createdAt)}</dd>
              </div>
              {detailJob.finishedOn && (
                <div>
                  <dt className={cn('text-xs font-medium text-(--ink-muted)')}>완료 시각</dt>
                  <dd className={cn('font-mono text-(--ink)')}>{formatTime(detailJob.finishedOn)}</dd>
                </div>
              )}
              {detailJob.status === 'delayed' && detailJob.delay && (
                <div>
                  <dt className={cn('text-xs font-medium text-(--ink-muted)')}>예정</dt>
                  <dd className={cn('text-(--info)')}>{formatDelay(detailJob.delay)} 후</dd>
                </div>
              )}
              {detailJob.failedReason && (
                <div>
                  <dt className={cn('text-xs font-medium text-(--ink-muted)')}>실패 사유</dt>
                  <dd className={cn('rounded-lg bg-(--danger-soft) p-3 text-(--danger)')}>{detailJob.failedReason}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </Drawer>

      {/* 헤더 */}
      <div className={cn('flex items-center justify-between')}>
        <div>
          <h2 className={cn('text-xl font-bold text-ink')}>큐 대시보드</h2>
          <p className={cn('text-sm text-ink-muted mt-1')}>작업 상세 모니터링</p>
        </div>
        <div className={cn('flex items-center gap-2')}>
          <Button
            variant={isPolling ? 'teal' : 'ghost'}
            size="sm"
            onClick={() => setIsPolling((p) => !p)}
          >
            {isPolling ? '자동 새로고침' : '새로고침 중지'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowClearModal(true)}
            disabled={isPending}
          >
            전체 클리어
          </Button>
          {onClose && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              닫기
            </Button>
          )}
        </div>
      </div>

      {/* 상태 범례 */}
      <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-(--border-light) bg-(--surface-muted) px-4 py-3')}>
        <span className={cn('text-xs font-medium text-(--ink-muted)')}>상태 범례</span>
        {STATUS_ORDER.map((status) => (
          <Badge key={status} variant={STATUS_BADGE_VARIANT[status]} dot>
            {STATUS_LABELS[status]}
          </Badge>
        ))}
      </div>

      {/* 요약 카드 */}
      {summary && (
        <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4')}>
          <Card padding="md">
            <h3 className={cn('text-sm font-medium text-ink-muted mb-4')}>전체 상태</h3>
            <div className={cn('grid grid-cols-5 gap-2')}>
              {(['failed', 'active', 'delayed', 'waiting', 'completed'] as const).map((status) => (
                <div key={status} className={cn('text-center')}>
                  <div className={cn('font-mono text-xl font-bold text-ink')}>
                    {summary.total[status]}
                  </div>
                  <div className={cn('text-xs text-ink-muted')}>{STATUS_LABELS[status]}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <h3 className={cn('text-sm font-medium text-ink-muted mb-4')}>타입별 (대기중)</h3>
            <div className={cn('flex gap-4')}>
              {(['post', 'comment', 'reply'] as const).map((type) => {
                const pending =
                  summary.byType[type].delayed +
                  summary.byType[type].waiting +
                  summary.byType[type].active;
                return (
                  <div key={type} className={cn('flex-1 text-center')}>
                    <div className={cn('font-mono text-xl font-bold text-ink')}>{pending}</div>
                    <div className={cn('text-xs text-ink-muted')}>{TYPE_LABELS[type]}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card padding="md">
            <h3 className={cn('text-sm font-medium text-ink-muted mb-4')}>카페별 (대기중)</h3>
            <div className={cn('space-y-2')}>
              {summary.byCafe.slice(0, 3).map((cafe) => (
                <div key={cafe.cafeId} className={cn('flex justify-between text-sm')}>
                  <a
                    href={`https://cafe.naver.com/f-e/cafes/${cafe.cafeId}/menus/0`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn('text-ink truncate flex-1 hover:text-accent underline-offset-2 hover:underline transition-colors')}
                  >
                    {cafe.cafeName}
                  </a>
                  <span className={cn('font-mono font-semibold text-ink')}>{cafe.count}</span>
                </div>
              ))}
              {summary.byCafe.length === 0 && (
                <p className={cn('text-sm text-ink-muted')}>대기 중인 작업 없음</p>
              )}
            </div>
          </Card>

          <Card padding="md">
            <h3 className={cn('text-sm font-medium text-ink-muted mb-4')}>계정별 (대기중)</h3>
            <div className={cn('space-y-2')}>
              {summary.byAccount.slice(0, 3).map((acc) => (
                <a
                  key={acc.accountId}
                  href={`http://localhost:3008/queue/task_${acc.accountId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('flex justify-between text-sm hover:bg-surface-muted rounded-lg px-2 py-1 -mx-2 transition-colors')}
                >
                  <span className={cn('text-ink truncate flex-1 font-mono')}>{acc.accountId}</span>
                  <span className={cn('font-mono font-semibold text-ink')}>{acc.count}</span>
                </a>
              ))}
              {summary.byAccount.length === 0 && (
                <p className={cn('text-sm text-ink-muted')}>대기 중인 작업 없음</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 필터 */}
      <Card padding="md" className={cn('space-y-3')}>
        <div className={cn('flex flex-wrap gap-4 items-center')}>
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

          <Select
            label="카페"
            value={filter.cafeId || 'all'}
            onChange={(e) => handleFilterChange('cafeId', e.target.value === 'all' ? '' : e.target.value)}
            options={[
              { value: 'all', label: '전체 카페' },
              ...cafes.map((c) => ({ value: c.cafeId, label: c.name })),
            ]}
            fullWidth={false}
            className="w-36"
          />

          <Select
            label="계정"
            value={filter.accountId || 'all'}
            onChange={(e) => handleFilterChange('accountId', e.target.value === 'all' ? '' : e.target.value)}
            options={[
              { value: 'all', label: '전체 계정' },
              ...accounts.map((a) => ({ value: a.id, label: a.id })),
            ]}
            fullWidth={false}
            className="w-36"
          />

          {jobsData && (
            <div className={cn('ml-auto font-mono text-sm text-ink-muted')}>
              총 {jobsData.total}건
            </div>
          )}
        </div>

        <div className={cn('flex gap-2')}>
          <input
            type="text"
            placeholder="키워드, 제목, 내용 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className={cn(
              'flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink',
              'placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10'
            )}
          />
          {searchKeyword && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchKeyword('')}
            >
              초기화
            </Button>
          )}
        </div>
      </Card>

      {/* Jobs 테이블 */}
      <Table>
        <TableHead>
          <tr>
            <TableCell header density="dense">상태</TableCell>
            <TableCell header density="dense">타입</TableCell>
            <TableCell header density="dense">계정</TableCell>
            <TableCell header density="dense">카페</TableCell>
            <TableCell header density="dense">내용</TableCell>
            <TableCell header density="dense">예정/시간</TableCell>
            <TableCell header density="dense" align="right">작업</TableCell>
          </tr>
        </TableHead>
        <TableBody>
          {filteredJobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              onDelete={(content) => setShowDeleteModal({ accountId: job.accountId, jobId: job.id, content })}
              onViewRelated={job.type === 'post' && job.articleId ? () => handleViewRelated(job.articleId!) : undefined}
              onViewDetail={() => setDetailJob(job)}
              isLoadingRelated={isLoadingRelated}
            />
          ))}
          {filteredJobs.length === 0 && (
            <tr>
              <td colSpan={7}>
                <EmptyState title={isPending ? '로딩 중...' : '작업이 없습니다'} />
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
  );
};

interface JobRowProps {
  job: JobDetail;
  onDelete: (content: string) => void;
  onViewRelated?: () => void;
  onViewDetail: () => void;
  isLoadingRelated: boolean;
}

const JobRow = ({ job, onDelete, onViewRelated, onViewDetail, isLoadingRelated }: JobRowProps) => {
  const TypeIcon = TYPE_ICONS[job.type];

  const getContentDisplay = () => {
    if (job.type === 'post') {
      return (
        <div>
          <div className={cn('font-medium text-ink truncate max-w-50')}>
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
        <div className={cn('text-ink truncate max-w-50')} title={job.content}>
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

  const contentForDelete = job.type === 'post'
    ? (job.subject || job.keyword || '글 작업')
    : (job.content?.slice(0, 30) || '댓글 작업');

  const canDelete = job.status !== 'active';

  return (
    <TableRow onClick={onViewDetail} className="group">
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
        <a
          href={`http://localhost:3008/queue/task_${job.accountId}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cn('font-mono text-ink hover:text-accent underline-offset-2 hover:underline transition-colors')}
        >
          {job.accountId}
        </a>
      </TableCell>
      <TableCell density="dense">
        <a
          href={`https://cafe.naver.com/f-e/cafes/${job.cafeId}/menus/0`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cn('text-ink truncate max-w-30 block hover:text-accent underline-offset-2 hover:underline transition-colors')}
          title={job.cafeName}
        >
          {job.cafeName || job.cafeId}
        </a>
      </TableCell>
      <TableCell density="dense">{getContentDisplay()}</TableCell>
      <TableCell density="dense">{getTimeDisplay()}</TableCell>
      <TableCell density="dense" align="right">
        <div className={cn('flex justify-end gap-1')} onClick={(e) => e.stopPropagation()}>
          {onViewRelated && (
            <button
              onClick={onViewRelated}
              disabled={isLoadingRelated}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                'bg-accent/10 text-accent hover:bg-accent/20',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="연관 댓글/대댓글 보기"
            >
              <Link2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
          <button
            onClick={() => onDelete(contentForDelete)}
            disabled={!canDelete}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
              'bg-danger-soft text-danger hover:bg-danger/20',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title={canDelete ? '삭제' : '진행 중인 작업은 삭제할 수 없습니다'}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};
