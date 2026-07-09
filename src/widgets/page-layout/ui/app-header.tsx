'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { resetCafesAtom } from '@/entities';
import { logout } from '@/features';
import { cn, ThemeToggle, userAtom, userInitializedAtom, userLoadingAtom } from '@/shared';

// 주요 메뉴
const MAIN_NAV = [
  { href: '/viral', label: '바이럴' },
  { href: '/manual-post', label: '수동' },
  { href: '/publish', label: '분리' },
  { href: '/comment-jobs', label: '댓글작업' },
  { href: '/queue', label: '큐' },
];

// 부가 메뉴
const SUB_NAV = [
  { href: '/nickname-change', label: '닉네임' },
  { href: '/accounts', label: '계정' },
  { href: '/cafe-join', label: '카페가입' },
  { href: '/settings', label: '설정' },
];

export const AppHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useAtom(userAtom);
  const [isLoading] = useAtom(userLoadingAtom);
  const [, setIsInitialized] = useAtom(userInitializedAtom);
  const [, resetCafes] = useAtom(resetCafesAtom);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownId = useId();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsInitialized(false);
    resetCafes();
    setIsDropdownOpen(false);
    router.push('/login');
    router.refresh();
  };

  const NavLink = ({
    href,
    label,
    layoutId,
  }: {
    href: string;
    label: string;
    layoutId: string;
  }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'relative inline-flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm font-medium',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
          isActive ? 'text-(--background)' : 'text-(--ink-muted) hover:text-(--ink)'
        )}
      >
        {isActive && (
          <motion.div
            layoutId={layoutId}
            className={cn('absolute inset-0 bg-(--accent) rounded-md')}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
          />
        )}
        <span className="relative z-10">{label}</span>
      </Link>
    );
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-(--surface)/95 backdrop-blur-xl',
        'border-b border-(--border-light)'
      )}
    >
      <div className={cn('mx-auto max-w-6xl px-4 py-2.5 lg:px-6')}>
        <div className={cn('flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between')}>
          <Link
            href="/"
            aria-label="Viro 홈"
            className={cn(
              'flex min-h-10 shrink-0 items-center gap-2 rounded-lg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)'
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-bold text-background'
              )}
            >
              V
            </div>
            <span className={cn('font-semibold text-(--ink)')}>Viro</span>
          </Link>

          <div className={cn('flex min-w-0 items-center gap-2')}>
            <div
              className={cn(
                'flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto pb-1 pr-1',
                '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
              )}
            >
              <nav aria-label="주요 메뉴" className={cn('flex min-w-max items-center gap-0.5')}>
                {MAIN_NAV.map((item) => (
                  <NavLink key={item.href} {...item} layoutId="mainNav" />
                ))}
              </nav>

              <div className={cn('mx-2 h-4 w-px shrink-0 bg-(--border)')} />

              <nav aria-label="관리 메뉴" className={cn('flex min-w-max items-center gap-0.5')}>
                {SUB_NAV.map((item) => (
                  <NavLink key={item.href} {...item} layoutId="subNav" />
                ))}
              </nav>
            </div>

            <div className={cn('flex shrink-0 items-center gap-1')}>
              <ThemeToggle />
              <div className={cn('relative min-w-[100px] flex justify-end')} ref={dropdownRef}>
                {isLoading ? (
                  <div className={cn('h-8')} />
                ) : user ? (
                  <React.Fragment>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="menu"
                      aria-controls={isDropdownOpen ? dropdownId : undefined}
                      className={cn(
                        'flex min-h-10 max-w-[160px] items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium',
                        'text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
                        isDropdownOpen && 'bg-(--surface-muted) text-(--ink)'
                      )}
                    >
                      <span className={cn('truncate')}>{user.displayName}</span>
                      <svg
                        aria-hidden="true"
                        className={cn(
                          'h-3.5 w-3.5 transition-transform duration-200',
                          isDropdownOpen && 'rotate-180'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          id={dropdownId}
                          role="menu"
                          aria-label="사용자 메뉴"
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className={cn(
                            'absolute right-0 top-full z-50 mt-1.5 min-w-[180px]',
                            'rounded-lg border border-(--border) bg-(--surface) py-1 shadow-lg'
                          )}
                        >
                          <div className={cn('border-b border-(--border-light) px-3 py-2')}>
                            <p className={cn('text-sm font-medium text-(--ink)')}>{user.displayName}</p>
                            <p className={cn('mt-0.5 text-xs text-(--ink-muted)')}>{user.userId}</p>
                          </div>

                          <div className={cn('py-1')}>
                            <Link
                              href="/settings"
                              role="menuitem"
                              onClick={() => setIsDropdownOpen(false)}
                              className={cn(
                                'flex min-h-9 items-center gap-2 px-3 py-2 text-sm',
                                'text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)',
                                'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--info)'
                              )}
                            >
                              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              설정
                            </Link>
                            <Link
                              href="/accounts"
                              role="menuitem"
                              onClick={() => setIsDropdownOpen(false)}
                              className={cn(
                                'flex min-h-9 items-center gap-2 px-3 py-2 text-sm',
                                'text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)',
                                'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--info)'
                              )}
                            >
                              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              계정 관리
                            </Link>
                          </div>

                          <div className={cn('border-t border-(--border-light) pt-1')}>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={handleLogout}
                              className={cn(
                                'flex min-h-9 w-full items-center gap-2 px-3 py-2 text-sm',
                                'text-red-500 transition-colors duration-150 hover:bg-red-50 dark:hover:bg-red-950/30',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--info)'
                              )}
                            >
                              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              로그아웃
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ) : (
                  <Link
                    href="/login"
                    className={cn(
                      'inline-flex min-h-10 items-center rounded-md px-2.5 py-1.5 text-sm font-medium',
                      'transition-all duration-200 ease-out',
                      'text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)'
                    )}
                  >
                    로그인
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
