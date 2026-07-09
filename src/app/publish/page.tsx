'use client';

import { cn } from '@/shared';
import { PostOnlyUI, CommentOnlyUI } from '@/features/auto-comment/publish';
import { PageLayout } from '@/widgets';
import { AnimatedTabs, AnimatedCard, SlideUp, HelpAccordion } from '@/shared';

const TABS = [
  { id: 'post', label: '글만 발행' },
  { id: 'comment', label: '댓글만 달기' },
];

export default function PublishPage() {
  return (
    <PageLayout
      title="분리 발행"
      subtitle="글만 발행하거나, 기존 글에 댓글만 달거나"
    >
      <AnimatedTabs tabs={TABS} defaultTab="post">
        {(activeTab) => (
          <AnimatedCard className={cn('p-6 lg:p-8')}>
            {activeTab === 'post' && (
              <div className={cn('space-y-6')}>
                <SlideUp>
                  <h2 className={cn('text-lg font-semibold text-(--ink)')}>글만 발행</h2>
                  <p className={cn('text-sm text-(--ink-muted) mt-1')}>
                    댓글 없이 글만 발행 (원고 데이터 축적 용도)
                  </p>
                </SlideUp>
                <PostOnlyUI />
              </div>
            )}

            {activeTab === 'comment' && (
              <div className={cn('space-y-6')}>
                <SlideUp>
                  <h2 className={cn('text-lg font-semibold text-(--ink)')}>댓글만 달기</h2>
                  <p className={cn('text-sm text-(--ink-muted) mt-1')}>
                    기존 글에 댓글/대댓글 자동 추가
                  </p>
                </SlideUp>
                <CommentOnlyUI />
              </div>
            )}
          </AnimatedCard>
        )}
      </AnimatedTabs>

      <SlideUp delay={0.2}>
        <HelpAccordion title="분리 발행 사용법" className={cn('mt-8')}>
          <div className={cn('grid gap-4 lg:grid-cols-2')}>
            <div className={cn('rounded-xl border border-(--border-light) bg-(--surface) p-5')}>
              <h3 className={cn('font-semibold text-(--ink) mb-3')}>글만 발행</h3>
              <ul className={cn('text-sm text-(--ink-muted) space-y-1.5')}>
                <li>• 키워드 입력 후 발행 버튼 클릭</li>
                <li>• 댓글 없이 글만 발행됨</li>
                <li>• 원고 데이터 축적 용도</li>
              </ul>
            </div>

            <div className={cn('rounded-xl border border-(--border-light) bg-(--surface) p-5')}>
              <h3 className={cn('font-semibold text-(--ink) mb-3')}>댓글만 달기</h3>
              <ul className={cn('text-sm text-(--ink-muted) space-y-1.5')}>
                <li>• 최근 글 중 랜덤 절반 선택</li>
                <li>• 글당 3~15개 (대댓글 50%)</li>
                <li>• 자동으로 댓글/대댓글 추가</li>
              </ul>
            </div>
          </div>

          <p className={cn('mt-4 text-xs text-(--ink-muted)')}>
            글 발행과 댓글을 분리하면 타임라인이 더 자연스러워집니다.
          </p>
        </HelpAccordion>
      </SlideUp>
    </PageLayout>
  );
}
