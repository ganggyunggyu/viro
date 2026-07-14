import { cn, HelpAccordion } from '@/shared';
import { CafeJoinUI } from './cafe-join-ui';
import { PageLayout } from '@/widgets';

export default function CafeJoinPage() {
  return (
    <PageLayout
      title="카페 일괄 가입"
      subtitle="모든 계정을 모든 카페에 자동으로 가입시킵니다"
    >
      <div className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-6 lg:p-8 max-w-3xl')}>
        <CafeJoinUI />
      </div>

      <HelpAccordion
        className={cn('mt-6 max-w-3xl')}
        title="사용 안내"
        items={[
          'accounts에 등록된 모든 계정',
          'cafes에 등록된 모든 카페',
          '이미 가입된 계정은 "이미 회원"으로 표시',
        ]}
      />
    </PageLayout>
  );
}
