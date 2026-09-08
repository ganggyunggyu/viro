import React from 'react';
import Link from 'next/link';
import { cn } from '@/shared';
import { VIRO } from '@/app/landing/_content/viro';
import { LANDING_LINKS } from '@/app/landing/_content/links';
import { LandingOperations } from '@/app/landing/_components/landing-operations';

export const LandingDetails = () => (
  <React.Fragment>
    <nav className={cn('product-section-nav product-container')} aria-label="페이지 목차">
      <a href="#features">주요 기능</a><a href="#workflow">작업 흐름</a><a href="#questions">자주 묻는 질문</a>
    </nav>
    <section id="features" className={cn('product-intro product-container')}>
      <div className={cn('intro-grid')}><h2>{VIRO.intro}</h2><p>{VIRO.introDescription}</p></div>
    </section>
    <section className={cn('feature-section product-container')} aria-label="주요 기능">
      {VIRO.featureList.map(({ title, description }) => (
        <article key={title} className={cn('product-feature')}><h3>{title}</h3><p>{description}</p></article>
      ))}
    </section>
    <LandingOperations />
    <section id="questions" className={cn('product-faq product-container')}>
      <h2>자주 묻는 질문</h2>
      <div className={cn('question-list')}>
        {VIRO.questionList.map(({ title, description }) => (
          <details key={title}>
            <summary>{title}<span aria-hidden="true">+</span></summary><p>{description}</p>
          </details>
        ))}
      </div>
    </section>
    <section className={cn('product-closing product-container')}>
      <h2>{VIRO.closing}</h2>
      <Link className={cn('product-button')} href={LANDING_LINKS.service}>
        바이로 시작하기 <span aria-hidden="true">↗</span>
      </Link>
      <a className={cn('closing-link')} href={LANDING_LINKS.overview}>
        세 서비스가 이어지는 방식 <span aria-hidden="true">↗</span>
      </a>
    </section>
  </React.Fragment>
);
