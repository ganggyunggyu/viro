'use client';

import React from 'react';
import { cn, Button } from '@/shared';
import {
  queueCommentReplacementJobsAction,
  scanLowCommentArticlesAction,
  scanCommentReplacementCandidatesAction,
} from './actions';
import type { ScanLowCommentArticlesResult } from './low-comment-scan';
import {
  CAFE_COMMENT_STYLE_LABELS,
  type CafeCommentStyle,
} from '@/shared/api/cafe-comment-style';
import type { CommentReplacementCandidate, ScanCommentReplacementResult } from './comment-replacement-scan';

const NEW_CAFE_IDS_DEFAULT = '31754837, 31754869, 31754875, 31754939, 31755069';

const getReplacementKey = ({ cafeId, articleId }: CommentReplacementCandidate) => `${cafeId}:${articleId}`;

interface AdvancedCommentToolsProps {
  onJobsQueued: () => void;
  onMessage: (message: { type: 'success' | 'error'; text: string }) => void;
  /** 위 폼에서 고른 댓글 어조를 전체 스캔에도 그대로 적용한다. */
  commentStyle: CafeCommentStyle;
}

/**
 * 카페 전체 스캔·댓글 교체처럼 운영자만 쓰는 도구. 링크만 붙여넣으면 되는 기본 흐름과 섞이면
 * 처음 쓰는 사람이 무엇부터 눌러야 할지 알 수 없어서 접이식으로 분리했다.
 */
export const AdvancedCommentTools = ({
  onJobsQueued,
  onMessage,
  commentStyle,
}: AdvancedCommentToolsProps) => {
  const [isScanPending, startScanTransition] = React.useTransition();
  const [scanResult, setScanResult] = React.useState<ScanLowCommentArticlesResult | null>(null);
  const [replacementCafeIds, setReplacementCafeIds] = React.useState(NEW_CAFE_IDS_DEFAULT);
  const [replacementScanResult, setReplacementScanResult] = React.useState<ScanCommentReplacementResult | null>(null);
  const [selectedReplacementKeys, setSelectedReplacementKeys] = React.useState<Set<string>>(new Set());
  const [isReplacementScanPending, startReplacementScanTransition] = React.useTransition();
  const [isReplacementQueuePending, startReplacementQueueTransition] = React.useTransition();

  const inputClassName = cn(
    'w-full rounded-lg border border-(--border) bg-(--surface) px-3.5 py-2.5 text-sm text-(--ink)',
    'placeholder:text-(--ink-tertiary) transition-colors',
    'focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10',
  );

  const handleScan = () => {
    setScanResult(null);
    startScanTransition(async () => {
      const result = await scanLowCommentArticlesAction({ commentStyle });
      setScanResult(result);
      onJobsQueued();
    });
  };

  const handleReplacementScan = () => {
    const cafeIds = replacementCafeIds
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (cafeIds.length === 0) {
      onMessage({ type: 'error', text: '대상 카페 ID를 하나 이상 입력해주세요' });
      return;
    }

    setReplacementScanResult(null);
    setSelectedReplacementKeys(new Set());
    startReplacementScanTransition(async () => {
      const result = await scanCommentReplacementCandidatesAction({ cafeIds });
      setReplacementScanResult(result);
      setSelectedReplacementKeys(new Set(result.candidates.map(getReplacementKey)));
    });
  };

  const handleReplacementSelection = (candidate: CommentReplacementCandidate, checked: boolean) => {
    const key = getReplacementKey(candidate);
    setSelectedReplacementKeys((previous) => {
      const next = new Set(previous);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleReplacementQueue = () => {
    if (!replacementScanResult) return;
    const selectedCandidates = replacementScanResult.candidates.filter((candidate) =>
      selectedReplacementKeys.has(getReplacementKey(candidate)),
    );
    if (selectedCandidates.length === 0) {
      onMessage({ type: 'error', text: '댓글 교체 작업으로 등록할 글을 선택해주세요' });
      return;
    }

    startReplacementQueueTransition(async () => {
      const result = await queueCommentReplacementJobsAction(selectedCandidates, commentStyle);
      if (result.queuedJobs.length > 0) {
        onMessage({ type: 'success', text: `댓글 교체 작업 ${result.queuedJobs.length}건을 등록했습니다` });
        onJobsQueued();
      }
      if (result.skipped.length > 0) {
        onMessage({ type: 'error', text: `등록 ${result.queuedJobs.length}건 · 스킵 ${result.skipped.length}건` });
      }
    });
  };

  return (
    <details className={cn('group rounded-2xl border border-(--border-light) bg-(--surface)')}>
      <summary
        className={cn(
          'flex cursor-pointer items-center justify-between gap-3 px-5 py-4',
          'text-sm font-medium text-(--ink-muted) hover:text-(--ink) transition-colors',
          'list-none [&::-webkit-details-marker]:hidden',
        )}
      >
        운영자 도구 — 카페 전체 스캔 · 댓글 교체
        <svg
          className={cn('h-4 w-4 shrink-0 text-(--ink-tertiary) transition-transform group-open:rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>

      <div className={cn('space-y-5 border-t border-(--border-light) px-5 py-4')}>
        <div className={cn('space-y-3')}>
          <div className={cn('flex items-center justify-between gap-3')}>
            <div>
              <h3 className={cn('text-sm font-semibold text-(--ink)')}>댓글 부족 글 자동 스캔</h3>
              <p className={cn('text-xs text-(--ink-muted)')}>
                등록된 모든 카페에서 댓글 3개 이하인 글을 찾아 작업을 큐에 등록합니다
              </p>
              <p className={cn('text-xs text-(--ink-tertiary)')}>
                어조: {CAFE_COMMENT_STYLE_LABELS[commentStyle]} (위에서 고른 값을 그대로 씁니다)
              </p>
            </div>
            <Button onClick={handleScan} disabled={isScanPending} size="sm" variant="secondary">
              {isScanPending ? '스캔 중...' : '지금 스캔'}
            </Button>
          </div>

          {scanResult && (
            <div className={cn('space-y-1 rounded-lg bg-(--surface-muted) p-3 text-xs text-(--ink-muted)')}>
              <p>
                카페 {scanResult.scannedCafes}개 스캔 · 대상 글 {scanResult.foundArticles.length}개 · 신규 등록{' '}
                {scanResult.queuedJobs.length}건
              </p>
              {scanResult.skipped.length > 0 && <p>스킵 {scanResult.skipped.length}건 (이미 진행·대기 중)</p>}
              {scanResult.errors.length > 0 && (
                <p className={cn('text-(--danger)')}>
                  에러: {scanResult.errors.map((e) => `${e.cafeSlug}(${e.error})`).join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className={cn('space-y-3 border-t border-(--border-light) pt-5')}>
          <div>
            <h3 className={cn('text-sm font-semibold text-(--ink)')}>댓글 맥락 불일치 교체</h3>
            <p className={cn('text-xs text-(--ink-muted)')}>
              제목과 무관한 댓글 비율이 높은 글만 골라 기존 댓글을 지우고 다시 작성합니다
            </p>
          </div>
          <input
            type="text"
            value={replacementCafeIds}
            onChange={(event) => setReplacementCafeIds(event.target.value)}
            placeholder="대상 카페 ID를 쉼표 또는 공백으로 구분"
            className={inputClassName}
          />
          <Button
            onClick={handleReplacementScan}
            disabled={isReplacementScanPending}
            size="sm"
            variant="secondary"
          >
            {isReplacementScanPending ? '링크 수집·판별 중...' : '불일치 글 수집'}
          </Button>

          {replacementScanResult && (
            <div className={cn('space-y-2 rounded-lg bg-(--surface-muted) p-3')}>
              <p className={cn('text-xs text-(--ink-muted)')}>
                카페 {replacementScanResult.scannedCafes}개 · 교체 후보 {replacementScanResult.candidates.length}건
              </p>
              {replacementScanResult.candidates.map((candidate) => {
                const key = getReplacementKey(candidate);
                return (
                  <label
                    key={key}
                    className={cn('flex items-start gap-2 rounded-md bg-(--surface) p-2 text-xs text-(--ink)')}
                  >
                    <input
                      type="checkbox"
                      checked={selectedReplacementKeys.has(key)}
                      onChange={(event) => handleReplacementSelection(candidate, event.target.checked)}
                      className={cn('mt-0.5 h-4 w-4 rounded border-(--border) accent-(--accent)')}
                    />
                    <span className={cn('min-w-0 flex-1')}>
                      <a
                        href={candidate.articleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn('font-medium hover:underline')}
                      >
                        {candidate.cafeSlug}/{candidate.articleId} · {candidate.title}
                      </a>
                      <span className={cn('mt-0.5 block text-(--ink-muted)')}>
                        댓글 {candidate.commentCount}개 중 불일치 {candidate.mismatchCount}개 (
                        {Math.round(candidate.mismatchRate * 100)}%)
                      </span>
                    </span>
                  </label>
                );
              })}
              {replacementScanResult.candidates.length > 0 && (
                <Button onClick={handleReplacementQueue} disabled={isReplacementQueuePending} fullWidth size="sm">
                  {isReplacementQueuePending
                    ? '댓글 교체 작업 등록 중...'
                    : `선택 ${selectedReplacementKeys.size}건 교체 작업 등록`}
                </Button>
              )}
              {replacementScanResult.errors.length > 0 && (
                <p className={cn('text-xs text-(--danger)')}>
                  에러: {replacementScanResult.errors.map(({ cafeSlug, error }) => `${cafeSlug}(${error})`).join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
