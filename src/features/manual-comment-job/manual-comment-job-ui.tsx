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
  mode: 'fixed' | 'generate';
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

const STATUS_LABEL: Record<ManualCommentJobView['status'], string> = {
  pending: '대기 중',
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

export const ManualCommentJobUI = () => {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [jobs, setJobs] = useState<ManualCommentJobView[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inputClassName = cn(
    'w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--ink)',
    'placeholder:text-(--ink-tertiary) transition-all',
    'focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10',
  );
  const labelClassName = cn('text-sm font-medium text-(--ink)');

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
        setMessage({ type: 'success', text: '작업이 등록되었습니다. 로컬 워커가 실행 중이면 자동으로 처리됩니다.' });
        setFormData(defaultFormState);
        loadJobs();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    });
  };

  return (
    <div className={cn('space-y-8')}>
      {/* 등록 폼 */}
      <div className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-6 space-y-5')}>
        <div>
          <h2 className={cn('text-lg font-semibold text-(--ink)')}>새 댓글 작업</h2>
          <p className={cn('text-sm text-(--ink-muted) mt-1')}>
            카페 글 URL을 붙여넣고 댓글을 등록하면, 로컬에서 돌아가는 워커가 계정을 배정해 자동으로 작업합니다
          </p>
        </div>

        {message && (
          <div
            className={cn(
              'rounded-xl border p-4 text-sm',
              message.type === 'success'
                ? 'border-(--success)/20 bg-(--success-soft) text-(--success)'
                : 'border-(--danger)/20 bg-(--danger-soft) text-(--danger)',
            )}
          >
            {message.text}
          </div>
        )}

        <div className={cn('space-y-2')}>
          <label className={labelClassName}>카페 글 URL</label>
          <input
            type="text"
            placeholder="https://cafe.naver.com/... 또는 https://m.cafe.naver.com/ca-fe/web/cafes/..."
            value={formData.articleUrl}
            onChange={(e) => setFormData((p) => ({ ...p, articleUrl: e.target.value }))}
            className={inputClassName}
          />
        </div>

        <div className={cn('flex gap-2')}>
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, mode: 'fixed' }))}
            className={cn(
              'flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
              formData.mode === 'fixed'
                ? 'border-(--accent) bg-(--accent)/10 text-(--accent)'
                : 'border-(--border) text-(--ink-muted) hover:text-(--ink)',
            )}
          >
            직접 작성한 댓글 붙여넣기
          </button>
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, mode: 'generate' }))}
            className={cn(
              'flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
              formData.mode === 'generate'
                ? 'border-(--accent) bg-(--accent)/10 text-(--accent)'
                : 'border-(--border) text-(--ink-muted) hover:text-(--ink)',
            )}
          >
            본문 읽고 AI로 자동 생성
          </button>
        </div>

        {formData.mode === 'fixed' ? (
          <div className={cn('space-y-2')}>
            <label className={labelClassName}>댓글 내용 (한 줄에 하나씩, 번호 붙여도 됨)</label>
            <textarea
              rows={6}
              placeholder={'좋은 정보 잘 보고가요!\n혹시 브랜드 추천도 알 수 있을까요?'}
              value={formData.fixedCommentsText}
              onChange={(e) => setFormData((p) => ({ ...p, fixedCommentsText: e.target.value }))}
              className={cn(inputClassName, 'resize-y')}
            />
          </div>
        ) : (
          <div className={cn('grid gap-4 md:grid-cols-2')}>
            <div className={cn('space-y-2')}>
              <label className={labelClassName}>최소 댓글 개수</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.generateMinCount}
                onChange={(e) => setFormData((p) => ({ ...p, generateMinCount: e.target.value.replace(/\D/g, '') }))}
                className={inputClassName}
              />
            </div>
            <div className={cn('space-y-2')}>
              <label className={labelClassName}>최대 댓글 개수</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.generateMaxCount}
                onChange={(e) => setFormData((p) => ({ ...p, generateMaxCount: e.target.value.replace(/\D/g, '') }))}
                className={inputClassName}
              />
            </div>
          </div>
        )}

        <div className={cn('grid gap-4 md:grid-cols-2')}>
          <div className={cn('space-y-2')}>
            <label className={labelClassName}>최소 딜레이 (분)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.delayMinMinutes}
              onChange={(e) => setFormData((p) => ({ ...p, delayMinMinutes: e.target.value }))}
              className={inputClassName}
            />
          </div>
          <div className={cn('space-y-2')}>
            <label className={labelClassName}>최대 딜레이 (분)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.delayMaxMinutes}
              onChange={(e) => setFormData((p) => ({ ...p, delayMaxMinutes: e.target.value }))}
              className={inputClassName}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={isPending} size="lg" fullWidth>
          작업 등록
        </Button>
      </div>

      {/* 작업 목록 */}
      <div className={cn('space-y-3')}>
        <div className={cn('flex items-center justify-between')}>
          <h2 className={cn('text-lg font-semibold text-(--ink)')}>최근 작업</h2>
          <span className={cn('text-xs text-(--ink-muted)')}>8초마다 자동 새로고침</span>
        </div>

        {jobs.length === 0 ? (
          <div className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-8 text-center')}>
            <p className={cn('text-sm text-(--ink-muted)')}>등록된 작업이 없습니다</p>
          </div>
        ) : (
          <ul className={cn('space-y-3')}>
            {jobs.map((job) => {
              const total = job.mode === 'fixed' ? job.fixedComments?.length || 0 : job.generateMaxCount || 0;
              const successCount = job.results.filter((r) => r.success).length;
              return (
                <li key={job.id} className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-5')}>
                  <div className={cn('flex items-start justify-between gap-4')}>
                    <div className={cn('min-w-0 flex-1')}>
                      <div className={cn('flex items-center gap-2 flex-wrap')}>
                        <span className={cn('text-sm font-semibold text-(--ink)')}>
                          {job.cafeSlug}/{job.articleId}
                        </span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', STATUS_STYLE[job.status])}>
                          {STATUS_LABEL[job.status]}
                        </span>
                        <span className={cn('text-xs text-(--ink-muted)')}>
                          {successCount}/{total || '?'} 성공
                        </span>
                      </div>
                      <p className={cn('text-xs text-(--ink-tertiary) mt-1 truncate')}>{job.articleUrl}</p>
                      {job.errorMessage && (
                        <p className={cn('text-xs text-(--danger) mt-1')}>{job.errorMessage}</p>
                      )}
                      {job.results.length > 0 && (
                        <ul className={cn('mt-2 space-y-1')}>
                          {job.results.map((r) => (
                            <li key={r.index} className={cn('text-xs flex items-start gap-2')}>
                              <span className={cn(r.success ? 'text-(--success)' : 'text-(--danger)')}>
                                {r.success ? '✓' : '✗'}
                              </span>
                              <span className={cn('text-(--ink-muted)')}>
                                {r.accountId ? `${r.accountId} — ` : ''}
                                {r.content}
                                {r.error ? ` (${r.error})` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
