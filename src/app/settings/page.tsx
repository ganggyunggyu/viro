import { cn } from '@/shared';
import { DelaySettingsUI } from '@/features/settings/delay-ui';
import { ApiKeySettingsUI } from '@/features/settings/api-key-ui';
import { PasswordChangeUI } from '@/features/auth/password-change-ui';
import { PageLayout } from '@/widgets';

export default function SettingsPage() {
  return (
    <PageLayout
      title="설정"
      subtitle="작업 딜레이 및 재시도 설정"
    >
      <div className={cn('space-y-6')}>
        <div
          className={cn(
            'rounded-2xl border border-(--border-light) bg-(--surface) p-6 lg:p-8'
          )}
        >
          <h2 className={cn('text-lg font-semibold text-(--ink) mb-6')}>큐 설정</h2>
          <DelaySettingsUI />
        </div>

        <div
          className={cn(
            'rounded-2xl border border-(--border-light) bg-(--surface) p-6 lg:p-8'
          )}
        >
          <h2 className={cn('text-lg font-semibold text-(--ink) mb-2')}>Gemini API 키</h2>
          <p className={cn('text-sm text-(--ink-muted) mb-6')}>
            네이버 로그인 캡차 자동 풀이에 사용하는 키입니다. 결제 차단 등으로 키가 죽으면 여기서 바로 교체할 수 있습니다.
          </p>
          <ApiKeySettingsUI />
        </div>

        <div
          className={cn(
            'rounded-2xl border border-(--border-light) bg-(--surface) p-6 lg:p-8'
          )}
        >
          <h2 className={cn('text-lg font-semibold text-(--ink) mb-6')}>비밀번호 변경</h2>
          <PasswordChangeUI />
        </div>
      </div>
    </PageLayout>
  );
}
