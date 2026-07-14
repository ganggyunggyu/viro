'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { cn, Checkbox, Button, ExecuteConfirmModal } from '@/shared';
import { Loader2, RefreshCw, Sparkles, PenLine } from 'lucide-react';
import { getCafesAction } from '@/features/accounts/actions';
import { REWRITE_KEYWORD_POOL } from '../batch/rewrite-keyword-pool';
import { inferCafeService } from '../batch/rewrite-cafe-service';
import {
  runRewriteBatchAction,
  getRewriteBatchStatusAction,
  type RewriteBatchStartResult,
  type RewriteBatchStatusResult,
  type RewriteKeywordSource,
} from './rewrite-actions';

interface CafeOption {
  cafeId: string;
  name: string;
}

interface JobRef {
  cafeId: string;
  cafeName: string;
  jobLogId: string;
  totalArticles: number;
}

const isStatusSettled = (status: RewriteBatchStatusResult | null): boolean => {
  if (!status) return false;
  return status.jobs.length > 0 && status.overallDone;
};

export const RewriteUI = () => {
  const [isPending, startTransition] = useTransition();
  const [cafes, setCafes] = useState<CafeOption[]>([]);
  const [cafesLoaded, setCafesLoaded] = useState(false);
  const [selectedCafeIds, setSelectedCafeIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [keywordSource, setKeywordSource] = useState<RewriteKeywordSource>('pool');
  const [customKeywordsText, setCustomKeywordsText] = useState('');
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [startResult, setStartResult] = useState<RewriteBatchStartResult | null>(null);
  const [jobRefs, setJobRefs] = useState<JobRef[]>([]);
  const [statusResult, setStatusResult] = useState<RewriteBatchStatusResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    const loadCafes = async () => {
      const data = await getCafesAction();
      setCafes(data.map((cafe) => ({ cafeId: cafe.cafeId, name: cafe.name })));
      setCafesLoaded(true);
    };
    loadCafes();
  }, []);

  useEffect(() => {
    if (!isPolling || jobRefs.length === 0) return;

    const poll = async () => {
      const status = await getRewriteBatchStatusAction(jobRefs.map((job) => job.jobLogId));
      setStatusResult(status);
      if (isStatusSettled(status)) {
        setIsPolling(false);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [isPolling, jobRefs]);

  const toggleCafe = useCallback((cafeId: string) => {
    setSelectedCafeIds((prev) =>
      prev.includes(cafeId) ? prev.filter((id) => id !== cafeId) : [...prev, cafeId]
    );
  }, []);

  const customKeywords = customKeywordsText
    .split('\n')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  const canSubmit =
    selectedCafeIds.length > 0 &&
    dateFrom.length > 0 &&
    dateTo.length > 0 &&
    (keywordSource === 'pool' || customKeywords.length > 0);

  const inputClassName = cn(
    'w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--ink)',
    'placeholder:text-(--ink-tertiary) transition-all',
    'focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10'
  );

  const labelClassName = cn('text-sm font-medium text-(--ink)');

  const handleSubmitClick = () => {
    if (!canSubmit) return;
    setShowExecuteModal(true);
  };

  const handleConfirmedSubmit = () => {
    setShowExecuteModal(false);

    startTransition(async () => {
      setStartResult(null);
      setStatusResult(null);
      setJobRefs([]);

      const res = await runRewriteBatchAction({
        cafeIds: selectedCafeIds,
        dateFrom,
        dateTo,
        keywordSource,
        customKeywords: keywordSource === 'custom' ? customKeywords : undefined,
      });

      setStartResult(res);

      if (res.success && res.jobs.length > 0) {
        setJobRefs(res.jobs);
        setIsPolling(true);
      }
    });
  };

  const selectedCafeNames = cafes
    .filter((cafe) => selectedCafeIds.includes(cafe.cafeId))
    .map((cafe) => cafe.name);

  const estimatedArticlesLabel =
    keywordSource === 'custom'
      ? `최대 ${customKeywords.length}개 (날짜 조건과 겹치는 만큼만 실제 진행)`
      : '날짜 조건에 맞는 글 전체 (실행 시 자동 산정)';

  return (
    <div className={cn('space-y-6')}>
      <div className={cn('space-y-3')}>
        <div className={cn('flex items-center justify-between')}>
          <label className={labelClassName}>대상 카페 선택</label>
          {selectedCafeIds.length > 0 && (
            <span className={cn('text-xs text-(--ink-muted)')}>{selectedCafeIds.length}개 선택</span>
          )}
        </div>

        {cafesLoaded && cafes.length === 0 ? (
          <div className={cn('rounded-xl border border-(--border-light) bg-(--surface-muted) p-4 text-sm text-(--ink-muted)')}>
            등록된 카페가 없습니다. 카페 관리 화면에서 먼저 카페를 등록해주세요.
          </div>
        ) : (
          <div className={cn('rounded-xl border border-(--border-light) bg-(--surface) divide-y divide-(--border-light)')}>
            {cafes.map((cafe) => (
              <label
                key={cafe.cafeId}
                htmlFor={`rewrite-cafe-${cafe.cafeId}`}
                className={cn('flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-(--surface-muted) transition-colors')}
              >
                <div className={cn('flex items-center gap-3')}>
                  <Checkbox
                    id={`rewrite-cafe-${cafe.cafeId}`}
                    checked={selectedCafeIds.includes(cafe.cafeId)}
                    onChange={() => toggleCafe(cafe.cafeId)}
                  />
                  <span className={cn('text-sm text-(--ink)')}>{cafe.name}</span>
                </div>
                <span className={cn('text-xs text-(--ink-muted)')}>{inferCafeService(cafe.name)}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2')}>
        <div className={cn('space-y-2')}>
          <label className={labelClassName}>시작일</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={inputClassName}
          />
        </div>
        <div className={cn('space-y-2')}>
          <label className={labelClassName}>종료일</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      <div className={cn('space-y-3')}>
        <label className={labelClassName}>키워드 소스</label>
        <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2')}>
          <button
            type="button"
            onClick={() => setKeywordSource('pool')}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
              keywordSource === 'pool'
                ? 'border-(--accent) bg-(--accent)/5'
                : 'border-(--border-light) bg-(--surface-muted) hover:bg-(--surface)'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                keywordSource === 'pool' ? 'bg-(--accent) text-white' : 'bg-(--surface) text-(--ink-muted)'
              )}
            >
              <Sparkles className={cn('w-4 h-4')} />
            </div>
            <div>
              <p className={cn('text-sm font-medium text-(--ink)')}>기본 키워드 풀</p>
              <p className={cn('text-xs text-(--ink-muted)')}>{REWRITE_KEYWORD_POOL.length}개 풀에서 자동 배정</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setKeywordSource('custom')}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
              keywordSource === 'custom'
                ? 'border-(--accent) bg-(--accent)/5'
                : 'border-(--border-light) bg-(--surface-muted) hover:bg-(--surface)'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                keywordSource === 'custom' ? 'bg-(--accent) text-white' : 'bg-(--surface) text-(--ink-muted)'
              )}
            >
              <PenLine className={cn('w-4 h-4')} />
            </div>
            <div>
              <p className={cn('text-sm font-medium text-(--ink)')}>직접 입력</p>
              <p className={cn('text-xs text-(--ink-muted)')}>키워드 목록을 직접 지정</p>
            </div>
          </button>
        </div>

        {keywordSource === 'custom' && (
          <div className={cn('space-y-2')}>
            <div className={cn('flex items-center justify-between')}>
              <label className={labelClassName}>키워드 목록 (한 줄에 하나씩)</label>
              {customKeywords.length > 0 && (
                <span className={cn('text-xs text-(--ink-muted)')}>{customKeywords.length}개</span>
              )}
            </div>
            <textarea
              placeholder={'키워드 목록 (한 줄에 하나씩)\n예:\n강아지 영양제\n족저근막염 신발'}
              value={customKeywordsText}
              onChange={(e) => setCustomKeywordsText(e.target.value)}
              className={cn(inputClassName, 'min-h-28 resize-none')}
              rows={4}
            />
          </div>
        )}
      </div>

      <ExecuteConfirmModal
        isOpen={showExecuteModal}
        onClose={() => setShowExecuteModal(false)}
        onConfirm={handleConfirmedSubmit}
        title="선택한 글을 재작성하시겠습니까?"
        description="기존 글의 제목/본문/이미지가 새 원고로 완전히 덮어써집니다."
        settings={[
          { label: '대상 카페', value: selectedCafeNames.join(', ') || '선택 안됨', highlight: true },
          { label: '날짜 범위', value: dateFrom && dateTo ? `${dateFrom} ~ ${dateTo}` : '미지정' },
          { label: '예상 글 개수', value: estimatedArticlesLabel },
          {
            label: '키워드 소스',
            value: keywordSource === 'pool' ? '기본 키워드 풀 (자동 배정)' : `직접 입력 (${customKeywords.length}개)`,
          },
        ]}
        warnings={[
          '기존 글의 제목/본문/이미지가 모두 새 원고로 교체됩니다.',
          '되돌릴 수 없는 작업이니 대상과 날짜 범위를 다시 확인해주세요.',
        ]}
        confirmText="재작성 시작"
        isLoading={isPending}
      />

      <Button onClick={handleSubmitClick} disabled={!canSubmit} isLoading={isPending} size="lg" fullWidth>
        <RefreshCw className={cn('w-4 h-4')} />
        선택한 글 재작성
      </Button>

      {startResult && (
        <div
          className={cn(
            'rounded-2xl border p-5',
            startResult.success
              ? 'border-(--success)/30 bg-(--success-soft)'
              : 'border-(--danger)/30 bg-(--danger-soft)'
          )}
        >
          <div className={cn('flex items-center justify-between mb-3')}>
            <h3 className={cn('font-semibold', startResult.success ? 'text-(--success)' : 'text-(--danger)')}>
              {startResult.success ? '재작성 시작됨' : '시작 실패'}
            </h3>
            {startResult.success && (
              <span className={cn('text-sm text-(--ink-muted)')}>{startResult.totalArticles}개 글</span>
            )}
          </div>
          <p className={cn('text-sm text-(--ink-muted)')}>{startResult.message}</p>

          {jobRefs.length > 0 && (
            <div className={cn('mt-4 space-y-3')}>
              <div className={cn('flex items-center justify-between')}>
                <h4 className={cn('text-sm font-medium text-(--ink)')}>진행 상황</h4>
                {isPolling ? (
                  <Button variant="secondary" size="xs" onClick={() => setIsPolling(false)}>
                    <Loader2 className={cn('w-3.5 h-3.5 animate-spin')} />
                    폴링 중지
                  </Button>
                ) : (
                  <span className={cn('text-xs text-(--success) font-medium')}>완료</span>
                )}
              </div>

              {jobRefs.map((job) => {
                const jobStatus = statusResult?.jobs.find((s) => s.jobLogId === job.jobLogId);
                const total = jobStatus?.totalKeywords ?? job.totalArticles;
                const completed = jobStatus?.completed ?? 0;
                const failed = jobStatus?.failed ?? 0;
                const progress = total > 0 ? ((completed + failed) / total) * 100 : 0;
                const failedResults = (jobStatus?.results ?? []).filter((r) => !r.success);

                return (
                  <div key={job.jobLogId} className={cn('rounded-xl bg-(--surface) p-3 border border-(--border-light)')}>
                    <div className={cn('flex items-center justify-between text-xs mb-2')}>
                      <span className={cn('font-medium text-(--ink)')}>{job.cafeName}</span>
                      <span className={cn('text-(--ink-muted)')}>
                        {completed}/{total} 완료
                        {failed > 0 && ` (${failed} 실패)`}
                      </span>
                    </div>
                    <div className={cn('h-1.5 rounded-full bg-(--surface-muted) overflow-hidden')}>
                      <div className={cn('h-full bg-(--accent) transition-all')} style={{ width: `${progress}%` }} />
                    </div>

                    {failedResults.length > 0 && (
                      <div className={cn('mt-3 space-y-1')}>
                        <p className={cn('text-xs font-medium text-(--danger)')}>실패 사유</p>
                        <ul className={cn('text-xs text-(--ink-muted) space-y-0.5')}>
                          {failedResults.map((r, i) => (
                            <li key={i}>
                              articleId={r.articleId} &quot;{r.keyword}&quot; — {r.error || '알 수 없는 오류'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
