'use client';

import React, { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { userAtom, userLoadingAtom, userInitializedAtom } from '@/shared';
import { getCurrentUser } from './actions';
import { cn } from '@/shared';
import { isStandaloneLanding } from '@/shared/config/public-route';

const PUBLIC_PATHS = ['/login'];

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useAtom(userAtom);
  const [isLoading, setIsLoading] = useAtom(userLoadingAtom);
  const [isInitialized, setIsInitialized] = useAtom(userInitializedAtom);

  const isLanding = isStandaloneLanding(pathname);
  const isPublicPath = isLanding || PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  useEffect(() => {
    if (isLanding || isInitialized) return;

    getCurrentUser().then((u) => {
      setUser(u);
      setIsLoading(false);
      setIsInitialized(true);
    });
  }, [isLanding, isInitialized, setUser, setIsLoading, setIsInitialized]);

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (!user && !isPublicPath) {
      router.replace('/login');
    }
  }, [user, isInitialized, isLoading, isPublicPath, router]);

  if (isLanding) return <React.Fragment>{children}</React.Fragment>;

  if (!isInitialized || isLoading) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center bg-background')}>
        <div className={cn('text-ink-muted text-sm')}>로딩 중...</div>
      </div>
    );
  }

  if (!user && !isPublicPath) {
    return null;
  }

  return <React.Fragment>{children}</React.Fragment>;
};
