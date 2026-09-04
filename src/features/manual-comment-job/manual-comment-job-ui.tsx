'use client';

import React from 'react';
import { CheckCircle2, Link2, MinusCircle, XCircle } from 'lucide-react';
import { cn, Button } from '@/shared';
import { CAFE_COMMENT_COUNT } from '@/shared/api/cafe-comment-count';
import {
  CAFE_COMMENT_STYLES,
  CAFE_COMMENT_STYLE_DESCRIPTIONS,
  CAFE_COMMENT_STYLE_LABELS,
  DEFAULT_CAFE_COMMENT_STYLE,
  type CafeCommentStyle,
} from '@/shared/api/cafe-comment-style';
import {
  createCommentJobsFromLinksAction,
  getCommentWorkerStatusAction,
  getManualCommentJobsAction,
  type BulkLinkOutcome,
  type CreateCommentJobsFromLinksResult,
} from './actions';
import type { ManualCommentJobView } from './job-view';
import type { CommentWorkerStatus } from './worker-status';
import { parseFixedComments, formatRelativeTime } from './manual-comment-job-ui-utils';
import { extractCafeLinks } from './extract-cafe-links';
import { WorkerStatusBanner } from './worker-status-banner';
import { AdvancedCommentTools } from './advanced-comment-tools';

type CommentSource = 'generate' | 'fixed' | 'agent';

interface FormState {
  linksText: string;
  source: CommentSource;
  fixedCommentsText: string;
  commentStyle: CafeCommentStyle;
  delayMinMinutes: string;
  delayMaxMinutes: string;
  deleteExisting: boolean;
}

const defaultFormState: FormState = {
  linksText: '',
  source: 'generate',
  fixedCommentsText: '',
  commentStyle: DEFAULT_CAFE_COMMENT_STYLE,
  delayMinMinutes: '0.5',
  delayMaxMinutes: '3',
  deleteExisting: false,
};

const SOURCE_OPTIONS: Array<{ value: CommentSource; label: string; hint: string }> = [
  { value: 'generate', label: 'AI 자동 작성', hint: `본문을 읽고 댓글 ${CAFE_COMMENT_COUNT}개를 만들어 답니다` },
  { value: 'fixed', label: '직접 입력', hint: '아래에 적은 댓글을 한 줄에 하나씩 그대로 답니다' },
];

const STATUS_LABEL: Record<ManualCommentJobView['status'], string> = {
  pending: '대기',
  running: '진행 중',
  done: '완료',
  failed: '실패',
  cancelled: '취소됨',
};

const STATUS_STYLE: Record<ManualCommentJobView['status'], string> = {
  pending: 'bg-(--surface-muted) text-(--ink-muted)',
  running: 'bg-(--info-soft) text-(--info)',
  done: 'bg-(--success-soft) text-(--success)',
  failed: 'bg-(--danger-soft) text-(--danger)',
  cancelled: 'bg-(--surface-muted) text-(--ink-muted)',
};

const OUTCOME_ICON: Record<BulkLinkOutcome['status'], React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  queued: CheckCircle2,
  skipped: MinusCircle,
  failed: XCircle,
};

const OUTCOME_COLOR: Record<BulkLinkOutcome['status'], string> = {
  queued: 'text-(--success)',
  skipped: 'text-(--ink-tertiary)',
  failed: 'text-(--danger)',
};

export const ManualCommentJobUI = () => {
  const [isPending, startTransition] = React.useTransition();
  const [formData, setFormData] = React.useState<FormState>(defaultFormState);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitResult, setSubmitResult] = React.useState<CreateCommentJobsFromLinksResult | null>(null);
  const [jobs, setJobs] = React.useState<ManualCommentJobView[]>([]);
  const [workerStatus, setWorkerStatus] = React.useState<CommentWorkerStatus | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const detectedLinks = React.useMemo(() => extractCafeLinks(formData.linksText), [formData.linksText]);

  const inputClassName = cn(
    'w-full rounded-lg border border-(--border) bg-(--surface) px-3.5 py-2.5 text-sm text-(--ink)',
    'placeholder:text-(--ink-tertiary) transition-colors',
    'focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10',
  );

  const refresh = React.useCallback(() => {
    startTransition(async () => {
      const [nextJobs, nextStatus] = await Promise.all([
        getManualCommentJobsAction(),
        getCommentWorkerStatusAction(),
      ]);
      setJobs(nextJobs);
      setWorkerStatus(nextStatus);
    });
  }, []);

  React.useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 8000);
    return () => clearInterval(timer);
  }, [refresh]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (detectedLinks.length === 0) {
      setMessage({ type: 'error', text: '카페 글 링크를 붙여넣어 주세요' });
      return;
    }

    const fixedComments = parseFixedComments(formData.fixedCommentsText);
    if (formData.source === 'fixed' && fixedComments.length === 0) {
      setMessage({ type: 'error', text: '댓글 내용을 한 줄에 하나씩 입력해주세요' });
      return;
    }

    setMessage(null);
    setSubmitResult(null);
    startTransition(async () => {
      const result = await createCommentJobsFromLinksAction({
        rawText: formData.linksText,
        mode: formData.source,
        fixedComments: formData.source === 'fixed' ? fixedComments : undefined,
        commentStyle: formData.source === 'generate' ? formData.commentStyle : undefined,
        delayMinMinutes: parseFloat(formData.delayMinMinutes) || 0.5,
        delayMaxMinutes: parseFloat(formData.delayMaxMinutes) || 3,
        deleteExisting: formData.deleteExisting,
      });

      setSubmitResult(result);
      if (result.queuedCount > 0) {
        setFormData((prev) => ({ ...prev, linksText: '', fixedCommentsText: '' }));
        setMessage({
          type: 'success',
          text: workerStatus?.isOnline
            ? `${result.queuedCount}건 등록됨 — 워커가 처리 중입니다`
            : `${result.queuedCount}건 등록됨 — 워커가 켜지면 처리됩니다`,
        });
      } else {
        setMessage({ type: 'error', text: '등록된 작업이 없습니다' });
      }
      refresh();
    });
  };

  const activeSource = SOURCE_OPTIONS.find(({ value }) => value === formData.source);

  return (
    <div className={cn('space-y-6')}>
      <WorkerStatusBanner status={workerStatus} />

      <div className={cn('space-y-4 rounded-2xl border border-(--border-light) bg-(--surface) p-5')}>
        <div>
          <h2 className={cn('text-base font-semibold text-(--ink)')}>댓글 달 글 붙여넣기</h2>
          <p className={cn('text-xs text-(--ink-muted)')}>
            카페 글 링크를 몇 개든 그대로 붙여넣으면 됩니다. 카톡·메모에서 통째로 복사해도 링크만 알아서 골라냅니다
          </p>
        </div>

        <textarea
          rows={5}
          placeholder={
            'https://cafe.naver.com/babsangnote702/14\nhttps://naver.me/5c8bfNME\nhttps://cafe.naver.com/tastetrip702/7'
          }
          value={formData.linksText}
          onChange={(e) => setFormData((p) => ({ ...p, linksText: e.target.value }))}
          className={cn(inputClassName, 'resize-y font-mono text-xs leading-relaxed')}
        />

        <div className={cn('flex items-center gap-1.5 text-xs')}>
          <Link2 className="h-3.5 w-3.5 shrink-0 text-(--ink-tertiary)" strokeWidth={2} />
          <span className={cn(detectedLinks.length > 0 ? 'text-(--ink)' : 'text-(--ink-tertiary)')}>
            {detectedLinks.length > 0 ? `링크 ${detectedLinks.length}개 인식됨` : '인식된 링크 없음'}
          </span>
        </div>

        <div className={cn('space-y-2')}>
          <div className={cn('inline-flex rounded-lg border border-(--border) bg-(--surface-muted) p-0.5')}>
            {SOURCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData((p) => ({ ...p, source: option.value }))}
                className={cn(
                  'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                  formData.source === option.value
                    ? 'bg-(--surface) text-(--ink) shadow-sm'
                    : 'text-(--ink-muted) hover:text-(--ink)',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {activeSource && <p className={cn('text-xs text-(--ink-muted)')}>{activeSource.hint}</p>}
        </div>

        {formData.source === 'generate' && (
          <div className={cn('space-y-2')}>
            <div className={cn('flex gap-1.5')}>
              {CAFE_COMMENT_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, commentStyle: style }))}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    formData.commentStyle === style
                      ? 'bg-(--accent) text-white'
                      : 'bg-(--surface-muted) text-(--ink-muted) hover:text-(--ink)',
                  )}
                >
                  {CAFE_COMMENT_STYLE_LABELS[style]}
                </button>
              ))}
            </div>
            <p className={cn('text-xs text-(--ink-muted)')}>
              {CAFE_COMMENT_STYLE_DESCRIPTIONS[formData.commentStyle]}
            </p>
          </div>
        )}

        {formData.source === 'fixed' && (
          <textarea
            rows={5}
            placeholder={'댓글 내용 (한 줄에 하나씩)\n좋은 정보 잘 보고가요!\n혹시 브랜드 추천도 알 수 있을까요?'}
            value={formData.fixedCommentsText}
            onChange={(e) => setFormData((p) => ({ ...p, fixedCommentsText: e.target.value }))}
            className={cn(inputClassName, 'resize-y')}
          />
        )}

        {formData.source === 'agent' && (
          <p className={cn('text-xs text-(--ink-muted)')}>
            AI 에이전트가 본문을 읽고 댓글 개수·내용·계정·간격까지 스스로 판단해 진행합니다
          </p>
        )}

        <details className={cn('group')}>
          <summary
            className={cn(
              'cursor-pointer list-none text-xs font-medium text-(--ink-muted) hover:text-(--ink)',
              '[&::-webkit-details-marker]:hidden',
            )}
          >
            고급 설정
          </summary>

          <div className={cn('mt-3 space-y-3 rounded-lg bg-(--surface-muted) p-3.5')}>
            <div className={cn('flex items-center gap-2')}>
              <span className={cn('text-xs font-medium text-(--ink-muted)')}>댓글 간격</span>
              <input
                type="text"
                inputMode="decimal"
                value={formData.delayMinMinutes}
                onChange={(e) => setFormData((p) => ({ ...p, delayMinMinutes: e.target.value }))}
                className={cn(inputClassName, 'w-16 text-center')}
              />
              <span className={cn('text-sm text-(--ink-tertiary)')}>~</span>
              <input
                type="text"
                inputMode="decimal"
                value={formData.delayMaxMinutes}
                onChange={(e) => setFormData((p) => ({ ...p, delayMaxMinutes: e.target.value }))}
                className={cn(inputClassName, 'w-16 text-center')}
              />
              <span className={cn('text-sm text-(--ink-tertiary)')}>분</span>
            </div>

            <label className={cn('flex items-center gap-2 text-sm text-(--ink)')}>
              <input
                type="checkbox"
                checked={formData.deleteExisting}
                onChange={(e) => setFormData((p) => ({ ...p, deleteExisting: e.target.checked }))}
                className={cn('h-4 w-4 rounded border-(--border) accent-(--accent)')}
              />
              기존 댓글 전체 삭제 후 재작성
            </label>

            <label className={cn('flex items-center gap-2 text-sm text-(--ink)')}>
              <input
                type="checkbox"
                checked={formData.source === 'agent'}
                onChange={(e) => setFormData((p) => ({ ...p, source: e.target.checked ? 'agent' : 'generate' }))}
                className={cn('h-4 w-4 rounded border-(--border) accent-(--accent)')}
              />
              AI 에이전트에 전부 맡기기
            </label>
          </div>
        </details>

        {message && (
          <p className={cn('text-sm', message.type === 'success' ? 'text-(--success)' : 'text-(--danger)')}>
            {message.text}
          </p>
        )}

        <Button onClick={handleSubmit} disabled={isPending || detectedLinks.length === 0} fullWidth>
          {detectedLinks.length > 0 ? `${detectedLinks.length}개 글에 댓글 달기` : '댓글 달기'}
        </Button>

        {submitResult && submitResult.outcomes.length > 0 && (
          <ul className={cn('space-y-1.5 rounded-lg bg-(--surface-muted) p-3')}>
            {submitResult.outcomes.map((outcome) => {
              const Icon = OUTCOME_ICON[outcome.status];
              return (
                <li key={outcome.link} className={cn('flex items-start gap-2 text-xs')}>
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', OUTCOME_COLOR[outcome.status])} strokeWidth={2} />
                  <span className={cn('min-w-0 flex-1 text-(--ink-muted)')}>
                    <span className={cn('text-(--ink)')}>{outcome.label}</span>
                    {outcome.reason ? ` — ${outcome.reason}` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AdvancedCommentTools
        onJobsQueued={refresh}
        onMessage={setMessage}
        commentStyle={formData.commentStyle}
      />

      <div className={cn('space-y-2')}>
        <h2 className={cn('text-base font-semibold text-(--ink)')}>최근 작업</h2>

        {jobs.length === 0 ? (
          <div className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-8 text-center')}>
            <p className={cn('text-sm text-(--ink-muted)')}>등록된 작업이 없습니다</p>
          </div>
        ) : (
          <ul
            className={cn(
              'divide-y divide-(--border-light) overflow-hidden rounded-2xl border border-(--border-light) bg-(--surface)',
            )}
          >
            {jobs.map((job) => {
              const total =
                job.mode === 'fixed'
                  ? job.fixedComments?.length || 0
                  : job.mode === 'generate'
                    ? job.generateMaxCount || 0
                    : 0;
              const successCount = job.results.filter((r) => r.success).length;
              const percent = job.mode !== 'agent' && total > 0 ? Math.round((successCount / total) * 100) : null;
              const isExpanded = expandedIds.has(job.id);

              return (
                <li key={job.id}>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(job.id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-(--surface-muted)',
                    )}
                  >
                    <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-xs font-medium', STATUS_STYLE[job.status])}>
                      {STATUS_LABEL[job.status]}
                    </span>
                    <span className={cn('shrink-0 text-sm font-medium text-(--ink)')}>
                      {job.cafeSlug}/{job.articleId}
                    </span>
                    {job.mode === 'agent' && <span className={cn('shrink-0 text-xs text-(--accent)')}>에이전트</span>}
                    {job.mode === 'generate' && job.commentStyle === 'question' && (
                      <span className={cn('shrink-0 text-xs text-(--accent)')}>
                        {CAFE_COMMENT_STYLE_LABELS.question}
                      </span>
                    )}
                    <span className={cn('min-w-0 flex-1 space-y-1')}>
                      <span className={cn('block truncate text-xs text-(--ink-muted)')}>
                        {successCount}
                        {job.mode !== 'agent' ? `/${total || '?'}` : ''}건
                        {percent !== null ? ` · ${percent}%` : ''} · {formatRelativeTime(job.createdAt)}
                        {job.deleteExisting
                          ? ` · 삭제 ${job.deleteResults.filter((r) => r.success).length}/${job.deleteResults.length}건`
                          : ''}
                        {job.errorMessage ? ` · ${job.errorMessage}` : ''}
                      </span>
                      {percent !== null && (
                        <span className={cn('block h-1 w-full max-w-40 overflow-hidden rounded-full bg-(--surface-muted)')}>
                          <span
                            className={cn(
                              'block h-full rounded-full transition-colors duration-150',
                              job.status === 'failed' ? 'bg-(--danger)' : 'bg-(--accent)',
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </span>
                      )}
                    </span>
                    <svg
                      className={cn(
                        'h-4 w-4 shrink-0 text-(--ink-tertiary) transition-transform',
                        isExpanded && 'rotate-180',
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className={cn('space-y-2 px-4 pb-4')}>
                      <a
                        href={job.articleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn('block truncate text-xs text-(--info) hover:underline')}
                      >
                        {job.articleUrl}
                      </a>
                      {job.agentSummary && <p className={cn('text-xs text-(--ink-muted)')}>{job.agentSummary}</p>}
                      {job.deleteResults.length > 0 && (
                        <div className={cn('space-y-1.5')}>
                          <p className={cn('text-xs font-medium text-(--ink-muted)')}>삭제된 기존 댓글</p>
                          <ul className={cn('space-y-1.5 rounded-lg bg-(--surface-muted) p-3')}>
                            {job.deleteResults.map((r) => (
                              <li key={r.index} className={cn('flex items-start gap-2 text-xs')}>
                                {r.success ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-(--success)" strokeWidth={2} />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 shrink-0 text-(--danger)" strokeWidth={2} />
                                )}
                                <span className={cn('text-(--ink-muted)')}>
                                  {r.accountId && <span className={cn('text-(--ink)')}>{r.accountId}</span>}
                                  {r.accountId ? ' — ' : ''}
                                  {r.content}
                                  {r.error ? ` (${r.error})` : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {job.results.length > 0 && (
                        <ul className={cn('space-y-1.5 rounded-lg bg-(--surface-muted) p-3')}>
                          {job.results.map((r) => (
                            <li key={r.index} className={cn('flex items-start gap-2 text-xs')}>
                              {r.success ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-(--success)" strokeWidth={2} />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 shrink-0 text-(--danger)" strokeWidth={2} />
                              )}
                              <span className={cn('text-(--ink-muted)')}>
                                {r.accountId && <span className={cn('text-(--ink)')}>{r.accountId}</span>}
                                {r.accountId ? ' — ' : ''}
                                {r.content}
                                {r.error ? ` (${r.error})` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
