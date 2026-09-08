import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/shared';
import { VIRO } from '@/app/landing/_content/viro';
import { LANDING_LINKS } from '@/app/landing/_content/links';
import { LandingHeader } from '@/app/landing/_components/landing-header';
import { LandingDemo } from '@/app/landing/_components/landing-demo-ui';
import { LandingDetails } from '@/app/landing/_components/landing-details';

export const LandingPage = () => (
  <div className={cn('viro-landing')}>
    <a className={cn('product-skip')} href="#product-title">본문으로 이동</a>
    <main>
      <div className={cn('product-canvas')}>
        <Image className={cn('product-sky')} src="/images/landing/sky.webp" alt=""
          width={1536} height={1024} loading="eager" fetchPriority="high" unoptimized />
        <LandingHeader />
        <section className={cn('product-hero')} aria-labelledby="product-title">
          <p className={cn('product-eyebrow')}>{VIRO.eyebrow}</p>
          <h1 id="product-title" tabIndex={-1}>{VIRO.headline.map((line) => <span key={line}>{line}</span>)}</h1>
          <p className={cn('product-lede')}>{VIRO.description}</p>
          <div className={cn('hero-actions')}>
            <Link className={cn('product-button')} href={LANDING_LINKS.service}>
              바이로 사용해보기 <span aria-hidden="true">↗</span>
            </Link>
            <a className={cn('product-demo-link')} href="#experience">
              {VIRO.action} <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>
        <LandingDemo />
      </div>
      <LandingDetails />
    </main>
    <footer className={cn('product-footer product-container')}>
      <Link className={cn('product-wordmark')} href={LANDING_LINKS.viro}>
        바이로<span className={cn('brand-dot')} aria-hidden="true" />
      </Link>
      <p>쓰고 퍼뜨리고 확인하는 일.</p>
      <a href={LANDING_LINKS.overview}>바이럴 한 바퀴 <span aria-hidden="true">↗</span></a>
    </footer>
  </div>
);
