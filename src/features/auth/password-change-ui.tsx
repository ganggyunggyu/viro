'use client';

import { useId, useState } from 'react';
import { useAtomValue } from 'jotai';
import { cn, Button, Input, userAtom } from '@/shared';
import { changePassword } from './actions';

export const PasswordChangeUI = () => {
  const user = useAtomValue(userAtom);
  const formId = useId();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    if (newPassword !== confirmPassword) {
      setResult({ success: false, message: '새 비밀번호 확인이 일치하지 않음' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setResult({ success: true, message: '비밀번호가 변경됐습니다.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setResult({ success: false, message: res.error || '변경 실패' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4')}>
      {user && (
        <p className={cn('text-sm text-(--ink-muted)')}>
          현재 계정: <span className={cn('font-medium text-(--ink)')}>{user.loginId}</span>
        </p>
      )}

      <Input
        id={`${formId}-current`}
        type="password"
        label="현재 비밀번호"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      <Input
        id={`${formId}-new`}
        type="password"
        label="새 비밀번호"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={4}
      />
      <Input
        id={`${formId}-confirm`}
        type="password"
        label="새 비밀번호 확인"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={4}
      />

      <Button type="submit" disabled={isSaving}>
        {isSaving ? '변경 중...' : '비밀번호 변경'}
      </Button>

      {result && (
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            result.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
          )}
        >
          {result.message}
        </div>
      )}
    </form>
  );
};
