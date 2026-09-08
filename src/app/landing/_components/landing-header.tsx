import Link from 'next/link';
import { cn } from '@/shared';
import { LANDING_LINKS } from '@/app/landing/_content/links';

export const LandingHeader = () => (
  <header className={cn('product-header')}>
    <Link className={cn('product-wordmark')} href={LANDING_LINKS.viro}>
      바이로<span className={cn('brand-dot')} aria-hidden="true" />
    </Link>
    <nav className={cn('product-nav')} aria-label="서비스 소개">
      <a href={LANDING_LINKS.dabut}>다붓</a>
      <Link href={LANDING_LINKS.viro} aria-current="page">바이로</Link>
      <a href={LANDING_LINKS.exposure}>노출지기</a>
    </nav>
    <Link className={cn('product-button compact')} href={LANDING_LINKS.service}>
      사용해보기 <span aria-hidden="true">↗</span>
    </Link>
  </header>
);
