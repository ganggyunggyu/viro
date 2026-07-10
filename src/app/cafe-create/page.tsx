import { cn, HelpAccordion } from '@/shared';
import { CafeCreateUI } from './cafe-create-ui';
import { PageLayout } from '@/widgets';

export default function CafeCreatePage() {
  return (
    <PageLayout
      title="카페 개설"
      subtitle="선택한 계정으로 새 네이버 카페를 실제로 만듭니다"
    >
      <div className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-6 lg:p-8 max-w-3xl')}>
        <CafeCreateUI />
      </div>

      <HelpAccordion
        className={cn('mt-6 max-w-3xl')}
        title="사용 안내"
        items={[
          '이미 카페를 소유한 계정은 선택 목록에서 자동으로 빠집니다',
          '실행 버튼을 누르면 드라이런 없이 실제로 카페가 만들어집니다 — 이름/주소를 다시 확인하세요',
          '성공하면 CafeConfig(DB)와 운영 현황 구글시트에 자동으로 기록됩니다',
          '카테고리는 네이버 폼에서 실제로 확인된 조합만 프리셋으로 제공합니다',
        ]}
      />
    </PageLayout>
  );
}
