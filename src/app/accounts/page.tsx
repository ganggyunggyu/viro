'use client';

import { cn } from '@/shared';
import { AccountManagerUI, CafeManagerUI } from '@/features/accounts';
import { PageLayout } from '@/widgets';
import { AnimatedTabs, AnimatedCard, SlideUp, HelpAccordion } from '@/shared';

const TABS = [
  { id: 'accounts', label: '계정 관리' },
  { id: 'cafes', label: '카페 관리' },
];

export default function AccountsPage() {
  return (
    <PageLayout
      title="계정 & 카페"
      subtitle="네이버 계정과 카페 설정을 관리합니다"
    >
      <AnimatedTabs tabs={TABS} defaultTab="accounts">
        {(activeTab) => (
          <AnimatedCard className={cn('p-6 lg:p-8')}>
            {activeTab === 'accounts' && (
              <div className={cn('space-y-6')}>
                <SlideUp>
                  <h2 className={cn('text-lg font-semibold text-(--ink)')}>네이버 계정</h2>
                  <p className={cn('text-sm text-(--ink-muted) mt-1')}>
                    자동화에 사용할 네이버 계정을 관리합니다
                  </p>
                </SlideUp>
                <AccountManagerUI />
              </div>
            )}

            {activeTab === 'cafes' && (
              <div className={cn('space-y-6')}>
                <SlideUp>
                  <h2 className={cn('text-lg font-semibold text-(--ink)')}>카페 설정</h2>
                  <p className={cn('text-sm text-(--ink-muted) mt-1')}>
                    발행할 카페와 카테고리를 설정합니다
                  </p>
                </SlideUp>
                <CafeManagerUI />
              </div>
            )}
          </AnimatedCard>
        )}
      </AnimatedTabs>

      <HelpAccordion
        className={cn('mt-8')}
        items={[
          '"계정 추가"/"카페 추가" 버튼으로 새 계정/카페 등록',
          '"테스트" 버튼으로 로그인 상태 확인',
          '기본 카페 설정으로 배치 작업 시 사용할 카페 지정',
        ]}
      />
    </PageLayout>
  );
}
