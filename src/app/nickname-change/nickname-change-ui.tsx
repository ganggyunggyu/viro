'use client';

import { useState, useTransition, useEffect } from 'react';
import { cn } from '@/shared';
import {
  BatchResultList,
  Select,
  Button,
  ExecuteConfirmModal,
  type BatchResultRow,
  type BatchResultSummaryItem,
} from '@/shared';
import { runDesktopAction } from '@/shared/lib/desktop-action-client';
import type {
  BatchNicknameResult,
  NicknameChangeMode,
} from '@/features/auto-comment/batch/nickname-changer';

interface Account {
  _id: string;
  accountId: string;
  nickname?: string;
  isMain?: boolean;
}

interface Cafe {
  _id: string;
  cafeId: string;
  name: string;
  isDefault?: boolean;
}

interface NicknameChangeUIProps {
  mode: NicknameChangeMode;
}

export const NicknameChangeUI = ({ mode }: NicknameChangeUIProps) => {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<BatchNicknameResult | null>(null);
  const [selectedCafeId, setSelectedCafeId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [showExecuteModal, setShowExecuteModal] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const [accountsRes, cafesRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/cafes'),
        ]);
        const accountsData = await accountsRes.json();
        const cafesData = await cafesRes.json();
        setAccounts(accountsData);
        setCafes(cafesData);

        if (cafesData.length > 0) {
          setSelectedCafeId(cafesData[0].cafeId);
        }
        if (accountsData.length > 0) {
          setSelectedAccountId(accountsData[0].accountId);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      }
    };
    loadData();
  }, []);

  const handleRunClick = () => {
    setShowExecuteModal(true);
  };

  const handleRun = () => {
    setShowExecuteModal(false);
    startTransition(async () => {
      setResult(null);

      try {
        setResult(await runDesktopAction<BatchNicknameResult>({
          type: 'nickname-change',
          mode,
          cafeId: mode === 'by-cafe' ? selectedCafeId : undefined,
          accountId: mode === 'by-account' ? selectedAccountId : undefined,
        }));
      } catch (error) {
        setResult({
          success: false,
          total: 0,
          changed: 0,
          failed: 1,
          results: [{
            success: false,
            accountId: selectedAccountId || 'Viro 프로그램',
            cafeId: selectedCafeId,
            cafeName: '',
            error: error instanceof Error ? error.message : '로컬 실행 실패',
          }],
        });
      }
    });
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'by-cafe':
        return `선택한 카페(${cafes.find((c) => c.cafeId === selectedCafeId)?.name || ''})에서 모든 계정의 닉네임 변경`;
      case 'by-account':
        return `선택한 계정(${selectedAccountId})으로 모든 카페의 닉네임 변경`;
      case 'all':
        return `모든 계정 × 모든 카페 = ${accounts.length * cafes.length}건 처리`;
    }
  };

  const resultSummary: BatchResultSummaryItem[] = result
    ? [
        { label: '성공', value: result.changed, variant: 'success' },
        { label: '실패', value: result.failed, variant: result.failed > 0 ? 'danger' : 'neutral' },
      ]
    : [];

  const resultRows: BatchResultRow[] = result
    ? result.results.map((row) => ({
        status: row.success ? 'success' : 'failure',
        primaryLabel: row.accountId,
        secondaryLabel: row.cafeName,
        detail:
          row.success && row.oldNickname && row.newNickname
            ? `${row.oldNickname} → ${row.newNickname}`
            : undefined,
        error: row.error,
      }))
    : [];

  return (
    <div className={cn('space-y-6')}>
      {/* 선택 옵션 */}
      {mode === 'by-cafe' && (
        <div className={cn('rounded-2xl border border-border bg-surface-muted p-4')}>
          <Select
            label="카페 선택"
            value={selectedCafeId}
            onChange={(e) => setSelectedCafeId(e.target.value)}
            options={cafes.map((cafe) => ({
              value: cafe.cafeId,
              label: `${cafe.name}${cafe.isDefault ? ' (기본)' : ''}`,
            }))}
            helperText={`${accounts.length}개 계정의 닉네임이 변경됩니다.`}
          />
        </div>
      )}

      {mode === 'by-account' && (
        <div className={cn('rounded-2xl border border-border bg-surface-muted p-4')}>
          <Select
            label="계정 선택"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            options={accounts.map((acc) => ({
              value: acc.accountId,
              label: `${acc.accountId}${acc.isMain ? ' (메인)' : ''}`,
            }))}
            helperText={`${cafes.length}개 카페의 닉네임이 변경됩니다.`}
          />
        </div>
      )}

      {/* 현재 설정 요약 */}
      <div className={cn('rounded-2xl border border-border bg-surface-muted p-4')}>
        <h3 className={cn('text-sm font-semibold text-ink mb-3')}>실행 요약</h3>
        <p className={cn('text-sm text-ink-muted')}>{getModeDescription()}</p>
      </div>

      {/* 실행 확인 모달 */}
      <ExecuteConfirmModal
        isOpen={showExecuteModal}
        onClose={() => setShowExecuteModal(false)}
        onConfirm={handleRun}
        title="닉네임 변경을 실행하시겠습니까?"
        description="아래 설정으로 닉네임이 변경됩니다."
        settings={[
          {
            label: '모드',
            value: mode === 'by-cafe' ? '카페별' : mode === 'by-account' ? '계정별' : '전체',
            highlight: true,
          },
          ...(mode === 'by-cafe'
            ? [{ label: '카페', value: cafes.find((c) => c.cafeId === selectedCafeId)?.name || selectedCafeId }]
            : []),
          ...(mode === 'by-account'
            ? [{ label: '계정', value: selectedAccountId }]
            : []),
          {
            label: '처리 대상',
            value:
              mode === 'by-cafe'
                ? `${accounts.length}개 계정`
                : mode === 'by-account'
                ? `${cafes.length}개 카페`
                : `${accounts.length * cafes.length}건`,
          },
        ]}
        confirmText="실행"
        isLoading={isPending}
      />

      <Button
        onClick={handleRunClick}
        disabled={accounts.length === 0 || cafes.length === 0}
        isLoading={isPending}
        size="lg"
        fullWidth
      >
        닉네임 변경 실행
      </Button>

      {/* 결과 */}
      {result && (
        <BatchResultList
          success={result.success}
          title="변경 완료"
          summary={resultSummary}
          rows={resultRows}
        />
      )}
    </div>
  );
};
