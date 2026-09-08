'use client';

import { useState, type MouseEvent } from 'react';
import { cn } from '@/shared';
import { VIRO } from '@/app/landing/_content/viro';
import { QueueScene } from '@/app/landing/_components/queue-scene';
import { handlePreviewMove, handlePreviewLeave } from '@/app/landing/_components/preview-motion';

export const LandingDemo = () => {
  const [activeStage, setActiveStage] = useState(0);
  const handleStageClick = ({ currentTarget }: MouseEvent<HTMLButtonElement>) => {
    setActiveStage(Number(currentTarget.dataset.stage));
  };

  return (
    <section id="experience" className={cn('product-experience')} aria-label="작업 단계 시연">
      <div className={cn('product-window')} onPointerMove={handlePreviewMove} onPointerLeave={handlePreviewLeave}>
        <div className={cn('window-bar')}>
          <span className={cn('window-dots')} aria-hidden="true"><i /><i /><i /></span>
          <span>바이로 <span className={cn('window-divider')}>/</span> {VIRO.stageList[activeStage]}</span>
          <span className={cn('preview-label')}>화면 예시</span>
        </div>
        <div className={cn('window-content')}>
          <aside className={cn('demo-sidebar')} aria-label="시연 단계 선택">
            <span className={cn('demo-brand')}>VIRO<span className={cn('brand-dot')} aria-hidden="true" /></span>
            <span className={cn('demo-sidebar-caption')}>작업 단계</span>
            {VIRO.stageList.map((stage, index) => (
              <button key={stage} type="button" data-stage={index} aria-pressed={activeStage === index}
                aria-controls="stage-preview" onClick={handleStageClick}>
                <span className={cn('stage-number')}>0{index + 1}</span>{stage}
              </button>
            ))}
            <p className={cn('demo-sidebar-note')}>단계를 선택하면<br />작업 예시가 바뀝니다.</p>
          </aside>
          <div id="stage-preview" className={cn('demo-main')} aria-live="polite" aria-atomic="true">
            <div key={activeStage} className={cn('demo-stage')}>
              <div className={cn('demo-heading')}>
                <span>0{activeStage + 1} / 03</span><p>{VIRO.stageTitleList[activeStage]}</p>
              </div>
              <QueueScene activeStage={activeStage} />
            </div>
          </div>
        </div>
      </div>
      <div className={cn('experience-caption')}>
        <p>{VIRO.stageDescriptionList[activeStage]}</p>
        <span>단계를 눌러 살펴보세요 <span aria-hidden="true">↗</span></span>
      </div>
    </section>
  );
};
