'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { login } from '@/features/auth/actions';
import { loginDabut } from '@/features/auth/dabut-actions';
import { LoginFormUI, type LoginMode } from '@/features/auth/login-form-ui';
import { Button, Logo, userAtom } from '@/shared';

export const LoginUI = () => {
  const router = useRouter();
  const setUser = useSetAtom(userAtom);
  const [mode, setMode] = useState<LoginMode>('common');
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const form = new FormData(event.currentTarget);
    const read = (name: string) => String(form.get(name) ?? '');
    setLoading(true);
    setError('');
    try {
      const result = mode === 'legacy' ? await login(read('loginId'), read('password')) : await loginDabut({
        username: read('loginId'), password: read('password'),
        ...(mode === 'signup' ? { label: read('displayName') } : {}),
        ...(linking && mode === 'common' ? { legacyLoginId: read('legacyLoginId'), legacyPassword: read('legacyPassword') } : {}),
      });
      if (result.success && result.user) {
        setUser(result.user);
        router.push('/');
      } else {
        setError(result.error || '로그인을 완료하지 못했습니다.');
        if (result.code === 'account_link_required') { setMode('common'); setLinking(true); }
      }
    } catch { setError('로그인 요청을 완료하지 못했습니다. 다시 시도하세요.'); }
    finally { setLoading(false); }
  };
  const changeMode = (next: LoginMode) => { setMode(next); setError(''); setLinking(false); };
  const handleCommon = () => changeMode('common');
  const handleLegacy = () => changeMode('legacy');
  const handleSignup = () => changeMode('signup');
  const handleLink = () => { setMode('common'); setLinking(!linking); setError(''); };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo variant="mark" size={56} className="rounded-2xl" />
          <h1 className="text-2xl font-semibold text-ink">Viro</h1>
        </div>
        <div className="rounded-2xl border border-border-light bg-surface p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold text-ink">{mode === 'legacy' ? '기존 바이로 로그인' : mode === 'signup' ? '다붓 공통 회원가입' : '다붓 계정으로 로그인'}</h2>
            <p className="text-sm text-ink-muted">Ply · 다붓 · 노출지기 · 바이로에서 같은 계정을 사용합니다.</p>
          </div>
          <LoginFormUI key={mode} mode={mode} linking={linking} loading={loading} error={error} onSubmit={handleSubmit} />
          <div className="space-y-1">
            {mode !== 'common' && <Button variant="ghost" fullWidth disabled={loading} onClick={handleCommon}>다붓 계정으로 로그인</Button>}
            {mode !== 'signup' && <Button variant="ghost" fullWidth disabled={loading} onClick={handleSignup}>다붓 공통 회원가입</Button>}
            {mode === 'common' && <Button variant="ghost" fullWidth disabled={loading} onClick={handleLink}>{linking ? '계정 연결 취소' : '기존 바이로 계정 연결'}</Button>}
            {mode !== 'legacy' && <Button variant="ghost" fullWidth disabled={loading} onClick={handleLegacy}>기존 바이로 계정으로 로그인</Button>}
          </div>
        </div>
      </div>
    </div>
  );
};
