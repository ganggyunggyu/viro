'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  BatchResultList,
  Button,
  cn,
  type BatchResultRow,
  type BatchResultSummaryItem,
} from '@/shared';
import { runCafeJoinBatchAction } from '@/features/auto-comment/batch/batch-actions';
import { getAccountsAction, getCafesAction } from '@/features/accounts/actions';
import type { BatchJoinResult } from '@/features/auto-comment/batch/cafe-join';

interface AccountInfo {
  id: string;
  isMain?: boolean;
}

interface CafeInfo {
  cafeId: string;
  name: string;
  isDefault?: boolean;
}

export const CafeJoinUI = () => {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<BatchJoinResult | null>(null);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [cafes, setCafes] = useState<CafeInfo[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [accountsData, cafesData] = await Promise.all([
        getAccountsAction(),
        getCafesAction(),
      ]);
      setAccounts(accountsData.map((a) => ({ id: a.id, isMain: a.isMain })));
      setCafes(cafesData.map((c) => ({ cafeId: c.cafeId, name: c.name, isDefault: c.isDefault })));
    };
    loadData();
  }, []);

  const handleRun = () => {
    startTransition(async () => {
      setResult(null);
      const res = await runCafeJoinBatchAction();
      setResult(res);
    });
  };

  const resultSummary: BatchResultSummaryItem[] = result
    ? [
        { label: '가입', value: result.joined, variant: 'success' },
        { label: '이미 회원', value: result.alreadyMember, variant: 'neutral' },
        { label: '실패', value: result.failed, variant: result.failed > 0 ? 'danger' : 'neutral' },
      ]
    : [];

  const resultRows: BatchResultRow[] = result
    ? result.results.map((row) => ({
        status: row.success ? (row.alreadyMember ? 'neutral' : 'success') : 'failure',
        primaryLabel: row.accountId,
        secondaryLabel: row.cafeName,
        detail: row.alreadyMember ? '이미 가입된 계정' : undefined,
        error: row.error,
      }))
    : [];

  return (
    <div className={cn('space-y-6')}>
      {/* 현재 설정 요약 */}
      <div className={cn('rounded-2xl border border-(--border) bg-(--surface-muted) p-4')}>
        <h3 className={cn('text-sm font-semibold text-(--ink) mb-3')}>
          현재 설정
        </h3>
        <div className={cn('grid gap-4 sm:grid-cols-2')}>
          <div>
            <p className={cn('text-xs font-medium text-(--ink-muted) mb-2')}>
              계정 ({accounts.length}개)
            </p>
            <div className={cn('space-y-1')}>
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={cn(
                    'text-sm px-2 py-1 rounded-lg bg-(--surface-elevated)',
                    acc.isMain && 'border border-(--accent)'
                  )}
                >
                  {acc.id} {acc.isMain && <span className={cn('text-xs text-(--accent)')}>(메인)</span>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className={cn('text-xs font-medium text-(--ink-muted) mb-2')}>
              카페 ({cafes.length}개)
            </p>
            <div className={cn('space-y-1')}>
              {cafes.map((cafe) => (
                <div
                  key={cafe.cafeId}
                  className={cn(
                    'text-sm px-2 py-1 rounded-lg bg-(--surface-elevated)',
                    cafe.isDefault && 'border border-(--teal)'
                  )}
                >
                  {cafe.name} {cafe.isDefault && <span className={cn('text-xs text-(--teal)')}>(기본)</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className={cn('text-xs text-(--ink-muted) mt-3')}>
          총 {accounts.length * cafes.length}건 처리 예정
        </p>
      </div>

      <Button
        variant="teal"
        size="lg"
        fullWidth
        isLoading={isPending}
        onClick={handleRun}
      >
        전체 카페 가입 실행
      </Button>

      {/* 결과 */}
      {result && (
        <BatchResultList
          success={result.success}
          title="가입 완료"
          summary={resultSummary}
          rows={resultRows}
        />
      )}
    </div>
  );
};
