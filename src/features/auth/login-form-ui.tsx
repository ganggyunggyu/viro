import { useId, type FormEvent } from 'react';
import { Button } from '@/shared/ui/button';

export type LoginMode = 'common' | 'legacy' | 'signup';
export interface LoginFormProps {
  mode: LoginMode;
  linking: boolean;
  loading: boolean;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const FIELD_CLASS = 'min-h-11 w-full rounded-lg border border-border-light bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/20';
const Field = ({ id, name, label, type = 'text', minLength }: { id: string; name: string; label: string; type?: string; minLength?: number }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-sm text-ink-muted">{label}</label>
    <input id={id} name={name} type={type} required minLength={minLength}
      autoComplete={type === 'password' ? 'current-password' : 'username'} className={FIELD_CLASS} />
  </div>
);

export const LoginFormUI = ({ mode, linking, loading, error, onSubmit }: LoginFormProps) => {
  const id = useId();
  const isSignup = mode === 'signup';
  const label = mode === 'legacy' ? '기존 바이로' : '다붓';
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <fieldset disabled={loading} className="space-y-4">
        <Field id={`${id}-login`} name="loginId" label={`${label} 아이디`} />
        <Field id={`${id}-password`} name="password" label={`${label} 비밀번호`} type="password" minLength={isSignup ? 8 : undefined} />
        {isSignup && <Field id={`${id}-display`} name="displayName" label="표시 이름" />}
        {linking && mode === 'common' && (
          <div className="space-y-4 border-t border-border-light pt-4">
            <p className="text-sm text-ink-muted">기존 카페와 작업을 이 계정에 연결합니다.</p>
            <Field id={`${id}-legacy-id`} name="legacyLoginId" label="기존 바이로 아이디" />
            <Field id={`${id}-legacy-password`} name="legacyPassword" label="기존 바이로 비밀번호" type="password" />
          </div>
        )}
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={loading} isLoading={loading} size="lg" fullWidth>
          {isSignup ? '다붓 공통 회원가입' : linking ? '계정 연결하고 로그인' : '로그인'}
        </Button>
      </fieldset>
    </form>
  );
};
