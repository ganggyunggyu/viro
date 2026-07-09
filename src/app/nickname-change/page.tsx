'use client';

import { cn } from '@/shared';
import { PageLayout } from '@/widgets';
import { AnimatedTabs, AnimatedCard, SlideUp, HelpAccordion } from '@/shared';
import { NicknameChangeUI } from './nickname-change-ui';

const TABS = [
  { id: 'by-cafe', label: '카페 기준' },
  { id: 'by-account', label: '계정 기준' },
  { id: 'all', label: '전체 순회' },
];

export default function NicknameChangePage() {
  return (
    <PageLayout
      title="닉네임 변경"
      subtitle="랜덤 닉네임으로 카페별 닉네임을 일괄 변경합니다"
    >
      <AnimatedTabs tabs={TABS} defaultTab="all">
        {(activeTab) => (
          <AnimatedCard className={cn('p-6 lg:p-8')}>
            <div className={cn('space-y-6')}>
              <SlideUp>
                <h2 className={cn('text-lg font-semibold text-ink')}>
                  {activeTab === 'by-cafe' && '카페 기준 닉네임 변경'}
                  {activeTab === 'by-account' && '계정 기준 닉네임 변경'}
                  {activeTab === 'all' && '전체 순회 닉네임 변경'}
                </h2>
              </SlideUp>
              <NicknameChangeUI mode={activeTab as 'by-cafe' | 'by-account' | 'all'} />
            </div>
          </AnimatedCard>
        )}
      </AnimatedTabs>

      <SlideUp delay={0.2}>
        <HelpAccordion
          title="사용 안내"
          className="mt-8"
          items={[
            '카페 기준: 선택한 카페에서 모든 계정의 닉네임 변경',
            '계정 기준: 선택한 계정으로 모든 카페의 닉네임 변경',
            '전체 순회: 모든 계정 × 모든 카페 조합 변경',
          ]}
        />
      </SlideUp>
    </PageLayout>
  );
}
