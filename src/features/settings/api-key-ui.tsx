'use client';

import { cn } from '@/shared';
import { useEffect, useState } from 'react';
import { Button, Input } from '@/shared';
import {
  getApiKeySettingsAction,
  updateGeminiApiKeyAction,
  clearGeminiApiKeyAction,
  testGeminiApiKeyAction,
  updateDeepseekApiKeyAction,
  clearDeepseekApiKeyAction,
  testDeepseekApiKeyAction,
  type ApiKeySettingsData,
} from './api-key-actions';

type KeySource = 'db' | 'env' | 'none';

const sourceLabel = (source: KeySource): string => {
  if (source === 'db') return '웹에서 등록한 키 사용 중';
  if (source === 'env') return '.env 기본값 사용 중';
  return '등록된 키 없음';
};

interface ApiKeyFieldProps {
  label: string;
  placeholder: string;
  masked: string | null;
  source: KeySource;
  hasKey: boolean;
  onSave: (value: string) => Promise<void>;
  onClear: () => Promise<void>;
  onTest: () => Promise<{ success: boolean; message: string; elapsedMs?: number }>;
}

const ApiKeyField = ({
  label,
  placeholder,
  masked,
  source,
  hasKey,
  onSave,
  onClear,
  onTest,
}: ApiKeyFieldProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; elapsedMs?: number } | null>(null);

  const handleSave = async () => {
    if (!inputValue.trim()) return;
    setIsSaving(true);
    setTestResult(null);
    try {
      await onSave(inputValue);
      setInputValue('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    setTestResult(null);
    try {
      await onClear();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTest();
      setTestResult(result);
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
            source === 'db' ? 'bg-(--accent)/10 text-(--accent)' : 'bg-(--surface-muted) text-(--ink-muted)'
          )}
        >
          {sourceLabel(source)}
        </span>
      </div>

      <p className={cn('text-xs text-(--ink-muted)')}>현재 키: {masked ?? '없음'}</p>

      <div className={cn('flex gap-2')}>
        <Input
          type="password"
          placeholder={placeholder}
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
        {source === 'db' && (
          <Button onClick={handleClear} disabled={isSaving} variant="ghost">
            DB 키 삭제 (.env로 폴백)
          </Button>
        )}
      </div>

      {testResult && (
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            testResult.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
          )}
        >
          {testResult.success ? '✓ 정상 응답' : '✗ 실패'} — {testResult.message}
          {typeof testResult.elapsedMs === 'number' && ` (${testResult.elapsedMs}ms)`}
        </div>
      )}
    </div>
  );
};

export const ApiKeySettingsUI = () => {
  const [data, setData] = useState<ApiKeySettingsData | null>(null);

  const load = async () => {
    const result = await getApiKeySettingsAction();
    setData(result);
  };

  useEffect(() => {
    load();
  }, []);

  if (!data) {
    return <div className={cn('text-sm text-(--ink-muted)')}>불러오는 중...</div>;
  }

  return (
    <div className={cn('space-y-6')}>
      <ApiKeyField
        label="Gemini (캡차 풀이)"
        placeholder="새 Gemini API 키 붙여넣기"
        masked={data.geminiApiKeyMasked}
        source={data.geminiApiKeySource}
        hasKey={data.hasGeminiApiKey}
        onSave={async (value) => setData(await updateGeminiApiKeyAction(value))}
        onClear={async () => setData(await clearGeminiApiKeyAction())}
        onTest={testGeminiApiKeyAction}
      />

      <div className={cn('border-t border-(--border-light)')} />

      <ApiKeyField
        label="DeepSeek (에이전트 댓글)"
        placeholder="새 DeepSeek API 키 붙여넣기"
        masked={data.deepseekApiKeyMasked}
        source={data.deepseekApiKeySource}
        hasKey={data.hasDeepseekApiKey}
        onSave={async (value) => setData(await updateDeepseekApiKeyAction(value))}
        onClear={async () => setData(await clearDeepseekApiKeyAction())}
        onTest={testDeepseekApiKeyAction}
      />

      <p className={cn('text-xs text-(--ink-muted)')}>
        여기서 키를 저장하면 pm2 워커 재시작 없이 다음 시도부터 바로 이 키를 씁니다.
      </p>
    </div>
  );
};
