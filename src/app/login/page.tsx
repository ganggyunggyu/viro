'use client';

import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { login, register } from '@/features';
import { Button, cn, userAtom } from '@/shared';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useSetAtom(userAtom);
  const [isRegister, setIsRegister] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const formId = useId();
  const displayNameId = `${formId}-display-name`;
  const loginIdId = `${formId}-login-id`;
  const passwordId = `${formId}-password`;
  const errorId = `${formId}-error`;

  const inputClassName = cn(
    'min-h-11 w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm',
    'transition-colors placeholder:text-ink-tertiary',
    'focus-visible:border-info focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/20'
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isRegister
      ? await register(loginId, password, displayName)
      : await login(loginId, password);

    setLoading(false);

    if (result.success && result.user) {
      setUser(result.user);
      router.push('/');
    } else {
      setError(result.error || '오류 발생');
    }
  };

  return (
    <div className={cn('min-h-screen bg-background flex items-center justify-center p-6')}>
      <div className={cn('w-full max-w-sm space-y-8')}>
        <div className={cn('text-center space-y-2')}>
          <div
            className={cn(
              'mx-auto h-14 w-14 rounded-2xl bg-accent text-background flex items-center justify-center text-xl font-bold'
            )}
          >
            V
          </div>
          <h1 className={cn('text-2xl font-semibold text-ink mt-4')}>Viro</h1>
          <p className={cn('text-sm text-ink-muted')}>네이버 카페 운영 콘솔</p>
        </div>

        <div className={cn('rounded-2xl border border-border-light bg-surface p-6 space-y-6')}>
          <div className={cn('space-y-2 text-center')}>
            <h2 className={cn('text-lg font-semibold text-ink')}>
              {isRegister ? '회원가입' : '로그인'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor={displayNameId} className={cn('sr-only')}>
                  이름
                </label>
                <input
                  id={displayNameId}
                  type="text"
                  autoComplete="name"
                  placeholder="이름"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClassName}
                  aria-describedby={error ? errorId : undefined}
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor={loginIdId} className={cn('sr-only')}>
                아이디
              </label>
              <input
                id={loginIdId}
                type="text"
                autoComplete="username"
                placeholder="아이디"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className={inputClassName}
                aria-describedby={error ? errorId : undefined}
                required
              />
            </div>
            <div>
              <label htmlFor={passwordId} className={cn('sr-only')}>
                비밀번호
              </label>
              <input
                id={passwordId}
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClassName}
                aria-describedby={error ? errorId : undefined}
                required
              />
            </div>

            {error && (
              <p id={errorId} role="alert" className={cn('text-center text-sm text-red-500')}>
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              size="lg"
              fullWidth
            >
              {isRegister ? '가입하기' : '로그인'}
            </Button>
          </form>

          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </Button>
        </div>
      </div>
    </div>
  );
}
