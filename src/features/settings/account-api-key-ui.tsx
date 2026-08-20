'use client';

import { cn, Select, Button, Input } from '@/shared';
import { useEffect, useState } from 'react';
import { getAccountsAction } from '@/entities/account';
import {
  getAccountApiKeyStatusAction,
  updateAccountApiKeyAction,
  clearAccountApiKeyAction,
  testAccountApiKeyAction,
  type AccountApiKeyStatus,
  type ApiKeyProvider,
} from './account-api-key-actions';

interface KeyFieldProps {
  accountId: string;
  provider: ApiKeyProvider;
  label: string;
  masked: string | null;
  hasKey: boolean;
  onChanged: (status: AccountApiKeyStatus) => void;
}

const KeyField = ({ accountId, provider, label, masked, hasKey, onChanged }: KeyFieldProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; elapsedMs?: number } | null>(null);

  const handleSave = async () => {
    if (!inputValue.trim()) return;
    setIsSaving(true);
    setTestResult(null);
    try {
      const status = await updateAccountApiKeyAction(accountId, provider, inputValue);
      onChanged(status);
      setInputValue('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    setTestResult(null);
    try {
      const status = await clearAccountApiKeyAction(accountId, provider);
      onChanged(status);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      setTestResult(await testAccountApiKeyAction(accountId, provider));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className={cn('space-y-3')}>
      <div className={cn('flex items-center justify-between text-sm')}>
        <span className={cn('font-medium text-(--ink)')}>{label}</span>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium',
            hasKey ? 'bg-(--accent)/10 text-(--accent)' : 'bg-(--surface-muted) text-(--ink-muted)'
          )}
        >
          {hasKey ? '등록됨' : '미등록'}
        </span>
      </div>

      <p className={cn('text-xs text-(--ink-muted)')}>현재 키: {masked ?? '없음'}</p>

      <div className={cn('flex gap-2')}>
        <Input
          type="password"
          placeholder={`이 계정에 등록할 ${label} 키`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={cn('flex-1')}
        />
        <Button onClick={handleSave} disabled={isSaving || !inputValue.trim()}>
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </div>

      <div className={cn('flex items-center gap-2')}>
        <Button onClick={handleTest} disabled={isTesting || !hasKey} variant="secondary">
          {isTesting ? '테스트 중...' : '키 테스트'}
        </Button>
        {hasKey && (
          <Button onClick={handleClear} disabled={isSaving} variant="ghost">
            이 계정 키 삭제
          </Button>
        )}
      </div>

      {testResult && (
        <div
          className={cn(
            'rounded-lg border border-(--border-light) bg-(--surface-muted) px-3 py-2 text-sm',
            testResult.success ? 'text-(--ink)' : 'text-(--danger)'
          )}
        >
          {testResult.success ? '✓ 정상 응답' : '✗ 실패'} — {testResult.message}
          {typeof testResult.elapsedMs === 'number' && ` (${testResult.elapsedMs}ms)`}
        </div>
      )}
    </div>
  );
};

export const AccountApiKeySettingsUI = () => {
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [status, setStatus] = useState<AccountApiKeyStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  useEffect(() => {
    getAccountsAction().then((list) => {
      const options = list.map((a) => ({ value: a.id, label: a.nickname ? `${a.nickname} (${a.id})` : a.id }));
      setAccounts(options);
      if (options.length > 0) setSelectedAccountId(options[0].value);
    });
  }, []);

  useEffect(() => {
    if (!selectedAccountId) return;
    setIsLoadingStatus(true);
    getAccountApiKeyStatusAction(selectedAccountId)
      .then(setStatus)
      .finally(() => setIsLoadingStatus(false));
  }, [selectedAccountId]);

  return (
    <div className={cn('space-y-6')}>
      <Select
        label="계정 선택"
        options={accounts}
        value={selectedAccountId}
        onChange={(e) => setSelectedAccountId(e.target.value)}
        placeholder="키를 관리할 계정을 선택하세요"
        fullWidth
      />

      {isLoadingStatus || !status ? (
        <div className={cn('text-sm text-(--ink-muted)')}>불러오는 중...</div>
      ) : (
        <>
          <KeyField
            accountId={selectedAccountId}
            provider="gemini"
            label="Gemini (캡차 풀이)"
            masked={status.geminiMasked}
            hasKey={status.hasGemini}
            onChanged={setStatus}
          />

          <div className={cn('border-t border-(--border-light)')} />

          <KeyField
            accountId={selectedAccountId}
            provider="deepseek"
            label="DeepSeek (에이전트 댓글)"
            masked={status.deepseekMasked}
            hasKey={status.hasDeepseek}
            onChanged={setStatus}
          />
        </>
      )}

      <p className={cn('text-xs text-(--ink-muted)')}>
        키는 계정마다 따로 저장됩니다(전역 공유 없음). 저장하면 워커 재시작 없이 이 계정의 다음 시도부터 바로 적용됩니다.
      </p>
    </div>
  );
};
