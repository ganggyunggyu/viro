'use client';

import { useState, useTransition, useEffect } from 'react';
import { useAtom } from 'jotai';
import { cn } from '@/shared';
import { Select, Button } from '@/shared';
import { ChevronDown, Loader2, ImageIcon, CalendarClock } from 'lucide-react';
import { getCafesAction } from '@/features/accounts/actions';
import { PostOptionsUI } from '@/entities/post-options';
import {
  postOptionsAtom,
  cafesAtom,
  selectedCafeIdAtom,
  cafesInitializedAtom,
  selectedCafeAtom,
  postKeywordsTextAtom,
  postRefAtom,
  postAttachImagesAtom,
  postsPerDayAtom,
} from '@/entities';
import { runPostOnlyAction, getPostQueueStatusAction, type QueueBatchResult, type QueueStatusResult } from './queue-actions';

const isQueueSettled = (status: QueueStatusResult | null) => {
  if (!status) return false;
  const accounts = Object.values(status);
  if (accounts.length === 0) return false;
  const hasSeenWork = accounts.some(
    (s) => s.waiting + s.active + s.completed + s.failed > 0
  );
  return hasSeenWork && accounts.every((s) => s.waiting + s.active === 0);
};

export const PostOnlyUI = () => {
  const [isPending, startTransition] = useTransition();
  const [cafes, setCafes] = useAtom(cafesAtom);
  const [selectedCafeId, setSelectedCafeId] = useAtom(selectedCafeIdAtom);
  const [cafesInitialized, setCafesInitialized] = useAtom(cafesInitializedAtom);
  const selectedCafe = useAtom(selectedCafeAtom)[0];
  const [keywordsText, setKeywordsText] = useAtom(postKeywordsTextAtom);
  const [ref, setRef] = useAtom(postRefAtom);
  const [postOptions, setPostOptions] = useAtom(postOptionsAtom);
  const [attachImages, setAttachImages] = useAtom(postAttachImagesAtom);
  const [postsPerDay, setPostsPerDay] = useAtom(postsPerDayAtom);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<QueueBatchResult | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatusResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const keywordCount = keywordsText
    .split('\n')
    .map((k) => k.trim())
    .filter((k) => k.length > 0).length;

  useEffect(() => {
    if (cafesInitialized) return;

    const loadCafes = async () => {
      const data = await getCafesAction();
      setCafes(data);
      const defaultCafe = data.find((c) => c.isDefault) || data[0];
      if (defaultCafe) setSelectedCafeId(defaultCafe.cafeId);
      setCafesInitialized(true);
    };
    loadCafes();
  }, [cafesInitialized, setCafes, setSelectedCafeId, setCafesInitialized]);

  useEffect(() => {
    if (!isPolling) return;

    const poll = async () => {
      const status = await getPostQueueStatusAction();
      setQueueStatus(status);
      if (isQueueSettled(status)) {
        setIsPolling(false);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [isPolling]);

  const inputClassName = cn(
    'w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--ink)',
    'placeholder:text-(--ink-tertiary) transition-all',
    'focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10'
  );

  const labelClassName = cn('text-sm font-medium text-(--ink)');

  const handleSubmit = () => {
    const keywords = keywordsText
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) return;

    startTransition(async () => {
      setResult(null);
      const parsedPostsPerDay = Number(postsPerDay);
      const res = await runPostOnlyAction({
        keywords,
        ref: ref || undefined,
        cafeId: selectedCafeId || undefined,
        postOptions,
        attachImages,
        postsPerDay: postsPerDay && parsedPostsPerDay > 0 ? parsedPostsPerDay : undefined,
      });
      setResult(res);
      if (res.success) {
        setIsPolling(true);
      }
    });
  };

  return (
    <div className={cn('space-y-6')}>
      <div className={cn('space-y-3')}>
        {cafesInitialized && cafes.length === 0 ? (
          <div className={cn('rounded-xl border border-(--border-light) bg-(--surface-muted) p-4 text-sm text-(--ink-muted)')}>
            등록된 카페가 없습니다. 카페 관리 화면에서 먼저 카페를 등록해주세요.
          </div>
        ) : (
          <Select
            label="카페 선택"
            value={selectedCafeId}
            onChange={(e) => setSelectedCafeId(e.target.value)}
            options={cafes.map((cafe) => ({
              value: cafe.cafeId,
              label: `${cafe.name}${cafe.isDefault ? ' (기본)' : ''}`,
            }))}
            helperText={selectedCafe && `카테고리: ${selectedCafe.categories.join(', ')}`}
          />
        )}

        <div className={cn('space-y-2')}>
          <div className={cn('flex items-center justify-between')}>
            <label className={labelClassName}>키워드 목록</label>
            {keywordCount > 0 && (
              <span className={cn('text-xs text-(--ink-muted)')}>{keywordCount}개</span>
            )}
          </div>
          <textarea
            placeholder={`키워드 목록 (한 줄에 하나씩)\n카테고리 지정: 키워드:카테고리\n예:\n제주도 맛집\n서울 카페:일상`}
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            className={cn(inputClassName, 'min-h-28 resize-none')}
            rows={4}
          />
        </div>

        <div className={cn('space-y-2')}>
          <label className={labelClassName}>참고 URL (선택)</label>
          <input
            type="text"
            placeholder="참고 URL"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2')}>
          <button
            type="button"
            onClick={() => setAttachImages((prev) => !prev)}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
              attachImages
                ? 'border-(--accent) bg-(--accent)/5'
                : 'border-(--border-light) bg-(--surface-muted) hover:bg-(--surface)'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                attachImages ? 'bg-(--accent) text-white' : 'bg-(--surface) text-(--ink-muted)'
              )}
            >
              <ImageIcon className={cn('w-4 h-4')} />
            </div>
            <div>
              <p className={cn('text-sm font-medium text-(--ink)')}>이미지 자동 첨부</p>
              <p className={cn('text-xs text-(--ink-muted)')}>키워드로 이미지를 검색해 본문에 삽입</p>
            </div>
          </button>

          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border border-(--border-light) bg-(--surface-muted) p-3'
            )}
          >
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--surface) text-(--ink-muted)')}>
              <CalendarClock className={cn('w-4 h-4')} />
            </div>
            <div className={cn('flex-1 min-w-0')}>
              <p className={cn('text-sm font-medium text-(--ink)')}>하루에 N개씩 발행</p>
              <input
                type="number"
                min={1}
                placeholder="비우면 랜덤 간격"
                value={postsPerDay}
                onChange={(e) => setPostsPerDay(e.target.value)}
                className={cn(
                  'mt-1 w-full rounded-lg border border-(--border) bg-(--surface) px-2 py-1 text-sm text-(--ink)',
                  'placeholder:text-(--ink-tertiary) focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10'
                )}
              />
            </div>
          </div>
        </div>

        <div className={cn('rounded-xl border border-(--border-light) bg-(--surface-muted) overflow-hidden')}>
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className={cn(
              'flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-(--ink)',
              'hover:bg-(--surface) transition-colors'
            )}
          >
            고급 옵션
            <ChevronDown
              className={cn('w-4 h-4 text-(--ink-muted) transition-transform', showAdvanced && 'rotate-180')}
            />
          </button>
          {showAdvanced && (
            <div className={cn('px-4 pb-4')}>
              <PostOptionsUI options={postOptions} onChange={setPostOptions} />
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!keywordsText.trim()}
        isLoading={isPending}
        size="lg"
        fullWidth
      >
        글만 발행
      </Button>

      {result && (
        <div
          className={cn(
            'rounded-2xl border p-5',
            result.success
              ? 'border-(--success)/30 bg-(--success-soft)'
              : 'border-(--danger)/30 bg-(--danger-soft)'
          )}
        >
          <div className={cn('flex items-center justify-between mb-3')}>
            <h3
              className={cn(
                'font-semibold',
                result.success ? 'text-(--success)' : 'text-(--danger)'
              )}
            >
              {result.success ? '큐에 추가됨' : '실패'}
            </h3>
            <span className={cn('text-sm text-(--ink-muted)')}>
              {result.jobsAdded}개 작업
            </span>
          </div>
          <p className={cn('text-sm text-(--ink-muted)')}>{result.message}</p>

          {queueStatus && Object.keys(queueStatus).length > 0 && (
            <div className={cn('mt-4 space-y-3')}>
              <div className={cn('flex items-center justify-between')}>
                <h4 className={cn('text-sm font-medium text-(--ink)')}>진행 상황</h4>
                {isPolling ? (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => setIsPolling(false)}
                  >
                    <Loader2 className={cn('w-3.5 h-3.5 animate-spin')} />
                    폴링 중지
                  </Button>
                ) : (
                  <span className={cn('text-xs text-(--success) font-medium')}>완료</span>
                )}
              </div>
              {Object.entries(queueStatus).map(([accountId, status]) => {
                const total = status.waiting + status.active + status.completed + status.failed;
                if (total === 0) return null;
                const progress = total > 0 ? ((status.completed + status.failed) / total) * 100 : 0;
                return (
                  <div key={accountId} className={cn('rounded-xl bg-(--surface) p-3 border border-(--border-light)')}>
                    <div className={cn('flex items-center justify-between text-xs mb-2')}>
                      <span className={cn('font-medium text-(--ink)')}>{accountId}</span>
                      <span className={cn('text-(--ink-muted)')}>
                        {status.completed}/{total} 완료
                        {status.failed > 0 && ` (${status.failed} 실패)`}
                      </span>
                    </div>
                    <div className={cn('h-1.5 rounded-full bg-(--surface-muted) overflow-hidden')}>
                      <div
                        className={cn('h-full bg-(--accent) transition-all')}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {status.active > 0 && (
                      <p className={cn('text-xs text-(--accent) mt-2')}>
                        {status.active}개 처리 중...
                      </p>
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
