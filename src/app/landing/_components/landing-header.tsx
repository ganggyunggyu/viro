import Link from 'next/link';
import { cn } from '@/shared';
import { LANDING_LINKS } from '@/app/landing/_content/links';

export const LandingHeader = () => (
  <header className={cn('product-header')}>
    <Link className={cn('product-wordmark')} href={LANDING_LINKS.viro}>
      바이로<span className={cn('brand-dot')} aria-hidden="true" />
    </Link>
    <Link className={cn('product-button compact')} href={LANDING_LINKS.service}>
      사용해보기 <span aria-hidden="true">↗</span>
    </Link>
  </header>
);
