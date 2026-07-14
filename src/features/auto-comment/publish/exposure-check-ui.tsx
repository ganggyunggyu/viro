'use client';

import { Fragment, useEffect, useState, useTransition } from 'react';
import { cn } from '@/shared';
import { Select, Button, Checkbox } from '@/shared';
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { getCafesAction, getAccountsAction } from '@/features/accounts/actions';
import { fetchRecentPublishedArticlesAction, runExposureCheckAction } from './exposure-actions';
import type {
  PublishedArticleSummary,
  ExposureCheckRequestItem,
  ExposureCheckRunResult,
} from './types';

interface CafeOption {
  cafeId: string;
  name: string;
  isDefault?: boolean;
}

interface AccountOption {
  id: string;
  nickname?: string;
}

type PickMode = 'published' | 'manual';

const inputClassName = cn(
  'w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--ink)',
  'placeholder:text-(--ink-tertiary) transition-all',
  'focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10'
);

const labelClassName = cn('text-sm font-medium text-(--ink)');

const formatDateTime = (iso?: string): string => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
};

const StatusBadge = ({ status }: { status?: string }) => {
  if (status === '노출') {
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-full bg-(--success-soft) px-2.5 py-1 text-xs font-medium text-(--success)')}>
        <CheckCircle2 className={cn('w-3.5 h-3.5')} />
        노출
      </span>
    );
  }
  if (status === '미노출') {
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-full bg-(--surface-muted) px-2.5 py-1 text-xs font-medium text-(--ink-muted)')}>
        <XCircle className={cn('w-3.5 h-3.5')} />
        미노출
      </span>
    );
  }
  if (status === '확인실패') {
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-full bg-(--danger-soft) px-2.5 py-1 text-xs font-medium text-(--danger)')}>
        <AlertCircle className={cn('w-3.5 h-3.5')} />
        확인실패
      </span>
    );
  }
  return <span className={cn('text-xs text-(--ink-tertiary)')}>미확인</span>;
};

export const ExposureCheckUI = () => {
  const [isPending, startTransition] = useTransition();
  const [cafes, setCafes] = useState<CafeOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [pickMode, setPickMode] = useState<PickMode>('published');

  const [articles, setArticles] = useState<PublishedArticleSummary[]>([]);
  const [articlesLoading, startArticlesTransition] = useTransition();
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<number>>(new Set());

  const [manualKeywordsText, setManualKeywordsText] = useState('');

  const [result, setResult] = useState<ExposureCheckRunResult | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      const [cafeData, accountData] = await Promise.all([getCafesAction(), getAccountsAction()]);
      setCafes(cafeData);
      setAccounts(accountData);

      const defaultCafe = cafeData.find((c) => c.isDefault) || cafeData[0];
      if (defaultCafe) setSelectedCafeId(defaultCafe.cafeId);

      const defaultAccount = accountData.find((a) => a.isMain) || accountData[0];
      if (defaultAccount) setSelectedAccountId(defaultAccount.id);
    };
    loadOptions();
  }, []);

  const loadArticles = (cafeId: string) => {
    if (!cafeId) return;
    startArticlesTransition(async () => {
      const data = await fetchRecentPublishedArticlesAction(cafeId, 30);
      setArticles(data);
      setSelectedArticleIds(new Set());
    });
  };

  useEffect(() => {
    if (pickMode === 'published' && selectedCafeId) {
      loadArticles(selectedCafeId);
    }
  }, [selectedCafeId, pickMode]);

  const handleToggleArticle = (articleId: number) => {
    setSelectedArticleIds((prev) => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedArticleIds.size === articles.length) {
      setSelectedArticleIds(new Set());
      return;
    }
    setSelectedArticleIds(new Set(articles.map((a) => a.articleId)));
  };

  const manualKeywords = manualKeywordsText
    .split('\n')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  const targetCount = pickMode === 'published' ? selectedArticleIds.size : manualKeywords.length;

  const handleRun = () => {
    if (!selectedCafeId || !selectedAccountId) return;

    const items: ExposureCheckRequestItem[] =
      pickMode === 'published'
        ? articles
            .filter((a) => selectedArticleIds.has(a.articleId))
            .map((a) => ({ cafeId: a.cafeId, keyword: a.keyword, articleId: a.articleId }))
        : manualKeywords.map((keyword) => ({ cafeId: selectedCafeId, keyword }));

    if (items.length === 0) return;

    startTransition(async () => {
      setResult(null);
      const res = await runExposureCheckAction({ accountId: selectedAccountId, items });
      setResult(res);
      if (pickMode === 'published') {
        loadArticles(selectedCafeId);
      }
    });
  };

  return (
    <div className={cn('space-y-6')}>
      <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2')}>
        <Select
          label="카페 선택"
          value={selectedCafeId}
          onChange={(e) => setSelectedCafeId(e.target.value)}
          options={cafes.map((cafe) => ({
            value: cafe.cafeId,
            label: `${cafe.name}${cafe.isDefault ? ' (기본)' : ''}`,
          }))}
        />
        <Select
          label="체크에 사용할 계정"
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          options={accounts.map((account) => ({
            value: account.id,
            label: account.nickname ? `${account.nickname} (${account.id})` : account.id,
          }))}
          helperText="네이버 검색을 열어 노출 여부를 확인할 때 사용하는 로그인 세션"
        />
      </div>

      <div className={cn('flex gap-2 rounded-xl border border-(--border-light) bg-(--surface-muted) p-1')}>
        <button
          type="button"
          onClick={() => setPickMode('published')}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pickMode === 'published' ? 'bg-(--surface) text-(--ink) shadow-xs' : 'text-(--ink-muted)'
          )}
        >
          발행글에서 선택
        </button>
        <button
          type="button"
          onClick={() => setPickMode('manual')}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pickMode === 'manual' ? 'bg-(--surface) text-(--ink) shadow-xs' : 'text-(--ink-muted)'
          )}
        >
          키워드 직접 입력
        </button>
      </div>

      {pickMode === 'published' && (
        <div className={cn('space-y-3')}>
          <div className={cn('flex items-center justify-between')}>
            <button
              type="button"
              onClick={handleToggleAll}
              disabled={articles.length === 0}
              className={cn('text-xs font-medium text-(--accent) hover:underline disabled:opacity-50')}
            >
              {selectedArticleIds.size === articles.length && articles.length > 0 ? '전체 해제' : '전체 선택'}
            </button>
            <div className={cn('flex items-center gap-2')}>
              <span className={cn('text-xs text-(--ink-muted)')}>{selectedArticleIds.size}개 선택됨</span>
              <button
                type="button"
                onClick={() => loadArticles(selectedCafeId)}
                className={cn('text-(--ink-muted) hover:text-(--ink)')}
                aria-label="새로고침"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', articlesLoading && 'animate-spin')} />
              </button>
            </div>
          </div>

          <div className={cn('max-h-80 space-y-2 overflow-y-auto rounded-xl border border-(--border-light) bg-(--surface) p-2')}>
            {articlesLoading && (
              <div className={cn('flex items-center justify-center py-8 text-(--ink-muted)')}>
                <Loader2 className={cn('w-5 h-5 animate-spin')} />
              </div>
            )}
            {!articlesLoading && articles.length === 0 && (
              <p className={cn('py-8 text-center text-sm text-(--ink-muted)')}>발행된 글이 없음</p>
            )}
            {!articlesLoading &&
              articles.map((article) => (
                <label
                  key={article.articleId}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
                    'hover:bg-(--surface-muted)'
                  )}
                >
                  <Checkbox
                    checked={selectedArticleIds.has(article.articleId)}
                    onChange={() => handleToggleArticle(article.articleId)}
                    className={cn('mt-0.5')}
                  />
                  <div className={cn('min-w-0 flex-1')}>
                    <div className={cn('flex items-center gap-2')}>
                      <span className={cn('truncate text-sm font-medium text-(--ink)')}>{article.keyword}</span>
                      <StatusBadge status={article.exposureStatus} />
                    </div>
                    <p className={cn('mt-0.5 truncate text-xs text-(--ink-muted)')}>
                      #{article.articleId} · {formatDateTime(article.publishedAt)}
                      {article.exposureRank ? ` · ${article.exposureRank}위` : ''}
                    </p>
                  </div>
                </label>
              ))}
          </div>
        </div>
      )}

      {pickMode === 'manual' && (
        <div className={cn('space-y-2')}>
          <label className={labelClassName}>키워드 목록 (선택된 카페 기준, 한 줄에 하나씩)</label>
          <textarea
            placeholder={'저녁 루틴 만드는 법\n아기 이유식 초기 거부'}
            value={manualKeywordsText}
            onChange={(e) => setManualKeywordsText(e.target.value)}
            className={cn(inputClassName, 'min-h-28 resize-none')}
            rows={4}
          />
          {manualKeywords.length > 0 && (
            <p className={cn('text-xs text-(--ink-muted)')}>{manualKeywords.length}개 키워드</p>
          )}
        </div>
      )}

      <Button
        onClick={handleRun}
        disabled={!selectedCafeId || !selectedAccountId || targetCount === 0 || isPending}
        isLoading={isPending}
        size="lg"
        fullWidth
      >
        노출체크 실행 {targetCount > 0 && `(${targetCount}건)`}
      </Button>

      {result && (
        <div
          className={cn(
            'rounded-2xl border p-5',
            result.success ? 'border-(--border-light) bg-(--surface)' : 'border-(--danger)/30 bg-(--danger-soft)'
          )}
        >
          <div className={cn('flex items-center justify-between mb-3')}>
            <h3 className={cn('font-semibold text-(--ink)')}>{result.success ? '노출체크 완료' : '실행 실패'}</h3>
            <span className={cn('text-sm text-(--ink-muted)')}>{result.message}</span>
          </div>

          {result.results.length > 0 && (
            <div className={cn('space-y-2 max-h-96 overflow-y-auto')}>
              {result.results.map((r, i) => (
                <Fragment key={`${r.cafeId}-${r.articleId ?? r.keyword}-${i}`}>
                  <div className={cn('rounded-xl border border-(--border-light) bg-(--surface) px-4 py-3')}>
                    <div className={cn('flex items-center justify-between gap-2')}>
                      <span className={cn('truncate text-sm font-medium text-(--ink)')}>{r.keyword}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className={cn('mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--ink-muted)')}>
                      <span>{r.cafeName}</span>
                      {r.rank && <span>검색 {r.rank}위</span>}
                      {r.foundLink && (
                        <a
                          href={r.foundLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn('text-(--accent) hover:underline')}
                        >
                          발견 링크 ↗
                        </a>
                      )}
                    </div>
                    {r.error && <p className={cn('mt-1 text-xs text-(--danger)')}>{r.error}</p>}
                  </div>
                </Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
