'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { cn, Button } from '@/shared';
import {
  createManualCommentJobAction,
  getManualCommentJobsAction,
  type ManualCommentJobView,
} from './actions';

interface FormState {
  articleUrl: string;
  mode: 'fixed' | 'generate' | 'agent';
  fixedCommentsText: string;
  generateMinCount: string;
  generateMaxCount: string;
  delayMinMinutes: string;
  delayMaxMinutes: string;
}

const defaultFormState: FormState = {
  articleUrl: '',
  mode: 'fixed',
  fixedCommentsText: '',
  generateMinCount: '8',
  generateMaxCount: '13',
  delayMinMinutes: '3',
  delayMaxMinutes: '8',
};

const MODE_OPTIONS: Array<{ value: FormState['mode']; label: string }> = [
  { value: 'fixed', label: '직접 입력' },
  { value: 'generate', label: 'AI 생성' },
  { value: 'agent', label: 'AI 에이전트' },
];

const STATUS_LABEL: Record<ManualCommentJobView['status'], string> = {
  pending: '대기',
  running: '진행 중',
  done: '완료',
  failed: '실패',
};

const STATUS_STYLE: Record<ManualCommentJobView['status'], string> = {
  pending: 'bg-(--surface-muted) text-(--ink-muted)',
  running: 'bg-(--info-soft) text-(--info)',
  done: 'bg-(--success-soft) text-(--success)',
  failed: 'bg-(--danger-soft) text-(--danger)',
};

const formatRelativeTime = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
};

export const ManualCommentJobUI = () => {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [jobs, setJobs] = useState<ManualCommentJobView[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inputClassName = cn(
    'w-full rounded-lg border border-(--border) bg-(--surface) px-3.5 py-2.5 text-sm text-(--ink)',
    'placeholder:text-(--ink-tertiary) transition-colors',
    'focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10',
  );
  const labelClassName = cn('text-xs font-medium text-(--ink-muted)');

  const loadJobs = () => {
    startTransition(async () => {
      const data = await getManualCommentJobsAction();
      setJobs(data);
    });
  };

  useEffect(() => {
    loadJobs();
    pollRef.current = setInterval(loadJobs, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!formData.articleUrl.trim()) {
      setMessage({ type: 'error', text: '글 URL을 입력해주세요' });
      return;
    }

    const fixedComments = formData.fixedCommentsText
      .split('\n')
      .map((line) => line.replace(/^\d+[.\s]*/, '').trim())
      .filter(Boolean);

    if (formData.mode === 'fixed' && fixedComments.length === 0) {
      setMessage({ type: 'error', text: '댓글 내용을 한 줄에 하나씩 입력해주세요' });
      return;
    }

    startTransition(async () => {
      const result = await createManualCommentJobAction({
        articleUrl: formData.articleUrl.trim(),
        mode: formData.mode,
        fixedComments: formData.mode === 'fixed' ? fixedComments : undefined,
        generateMinCount: formData.mode === 'generate' ? parseInt(formData.generateMinCount) || 8 : undefined,
        generateMaxCount: formData.mode === 'generate' ? parseInt(formData.generateMaxCount) || 13 : undefined,
        delayMinMinutes: parseFloat(formData.delayMinMinutes) || 3,
        delayMaxMinutes: parseFloat(formData.delayMaxMinutes) || 8,
      });

      if (result.success) {
        setMessage({ type: 'success', text: '등록됨 · 로컬 워커가 처리합니다' });
        setFormData(defaultFormState);
        loadJobs();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    });
  };

  return (
    <div className={cn('space-y-6')}>
      {/* 등록 폼 */}
      <div className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-5 space-y-4')}>
        <h2 className={cn('text-base font-semibold text-(--ink)')}>새 댓글 작업</h2>

        <input
          type="text"
          placeholder="카페 글 URL"
          value={formData.articleUrl}
          onChange={(e) => setFormData((p) => ({ ...p, articleUrl: e.target.value }))}
          className={inputClassName}
        />

        <div className={cn('inline-flex rounded-lg border border-(--border) p-0.5 bg-(--surface-muted)')}>
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormData((p) => ({ ...p, mode: opt.value }))}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                formData.mode === opt.value
                  ? 'bg-(--surface) text-(--ink) shadow-sm'
                  : 'text-(--ink-muted) hover:text-(--ink)',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {formData.mode === 'fixed' && (
          <textarea
            rows={5}
            placeholder={'댓글 내용 (한 줄에 하나씩)\n좋은 정보 잘 보고가요!\n혹시 브랜드 추천도 알 수 있을까요?'}
            value={formData.fixedCommentsText}
            onChange={(e) => setFormData((p) => ({ ...p, fixedCommentsText: e.target.value }))}
            className={cn(inputClassName, 'resize-y')}
          />
        )}

        {formData.mode === 'generate' && (
          <div className={cn('flex items-center gap-2')}>
            <span className={labelClassName}>댓글 개수</span>
            <input
              type="text"
              inputMode="numeric"
              value={formData.generateMinCount}
              onChange={(e) => setFormData((p) => ({ ...p, generateMinCount: e.target.value.replace(/\D/g, '') }))}
              className={cn(inputClassName, 'w-16 text-center')}
            />
            <span className={cn('text-sm text-(--ink-tertiary)')}>~</span>
            <input
              type="text"
              inputMode="numeric"
              value={formData.generateMaxCount}
              onChange={(e) => setFormData((p) => ({ ...p, generateMaxCount: e.target.value.replace(/\D/g, '') }))}
              className={cn(inputClassName, 'w-16 text-center')}
            />
            <span className={cn('text-sm text-(--ink-tertiary)')}>개</span>
          </div>
        )}

        {formData.mode === 'agent' && (
          <p className={cn('text-xs text-(--ink-muted)')}>
            DeepSeek이 본문을 읽고 댓글 개수·내용·계정·간격까지 스스로 판단해 진행합니다
          </p>
        )}

        {formData.mode !== 'agent' && (
          <div className={cn('flex items-center gap-2')}>
            <span className={labelClassName}>딜레이</span>
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
        )}

        {message && (
          <p className={cn('text-sm', message.type === 'success' ? 'text-(--success)' : 'text-(--danger)')}>
            {message.text}
          </p>
        )}

        <Button onClick={handleSubmit} disabled={isPending} fullWidth>
          작업 등록
        </Button>
      </div>

      {/* 작업 목록 */}
      <div className={cn('space-y-2')}>
        <h2 className={cn('text-base font-semibold text-(--ink)')}>최근 작업</h2>

        {jobs.length === 0 ? (
          <div className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-8 text-center')}>
            <p className={cn('text-sm text-(--ink-muted)')}>등록된 작업이 없습니다</p>
          </div>
        ) : (
          <ul className={cn('divide-y divide-(--border-light) rounded-2xl border border-(--border-light) bg-(--surface) overflow-hidden')}>
            {jobs.map((job) => {
              const total =
                job.mode === 'fixed'
                  ? job.fixedComments?.length || 0
                  : job.mode === 'generate'
                    ? job.generateMaxCount || 0
                    : 0;
              const successCount = job.results.filter((r) => r.success).length;
              const isExpanded = expandedIds.has(job.id);

              return (
                <li key={job.id}>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(job.id)}
                    className={cn('flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-(--surface-muted) transition-colors')}
                  >
                    <span
                      className={cn('shrink-0 text-xs px-2 py-0.5 rounded-md font-medium', STATUS_STYLE[job.status])}
                    >
                      {STATUS_LABEL[job.status]}
                    </span>
                    <span className={cn('shrink-0 text-sm font-medium text-(--ink)')}>
                      {job.cafeSlug}/{job.articleId}
                    </span>
                    {job.mode === 'agent' && (
                      <span className={cn('shrink-0 text-xs text-(--accent)')}>에이전트</span>
                    )}
                    <span className={cn('text-xs text-(--ink-muted) truncate flex-1')}>
                      {successCount}
                      {job.mode !== 'agent' ? `/${total || '?'}` : ''}건 · {formatRelativeTime(job.createdAt)}
                      {job.errorMessage ? ` · ${job.errorMessage}` : ''}
                    </span>
                    <svg
                      className={cn('shrink-0 w-4 h-4 text-(--ink-tertiary) transition-transform', isExpanded && 'rotate-180')}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className={cn('px-4 pb-4 space-y-2')}>
                      <a
                        href={job.articleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn('block text-xs text-(--info) hover:underline truncate')}
                      >
                        {job.articleUrl}
                      </a>
                      {job.agentSummary && <p className={cn('text-xs text-(--ink-muted)')}>{job.agentSummary}</p>}
                      {job.results.length > 0 && (
                        <ul className={cn('space-y-1.5 rounded-lg bg-(--surface-muted) p-3')}>
                          {job.results.map((r) => (
                            <li key={r.index} className={cn('text-xs flex items-start gap-2')}>
                              <span className={cn('shrink-0', r.success ? 'text-(--success)' : 'text-(--danger)')}>
                                {r.success ? '✓' : '✗'}
                              </span>
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
