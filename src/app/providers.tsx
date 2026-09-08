'use client';

import { ReactNode } from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/features';
import { isStandaloneLanding } from '@/app/public-route';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  const pathname = usePathname();
  if (isStandaloneLanding(pathname)) return children;

  return (
    <JotaiProvider>
      <AuthGuard>{children}</AuthGuard>
    </JotaiProvider>
  );
};
