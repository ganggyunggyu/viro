'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAtom, useAtomValue } from 'jotai';
import { motion } from 'framer-motion';
import {
  ChevronUp,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { resetCafesAtom } from '@/entities';
import { logout } from '@/features';
import {
  cn,
  Drawer,
  Logo,
  LogoMark,
  mobileSidebarOpenAtom,
  sidebarCollapsedAtom,
  userAtom,
  userInitializedAtom,
  userLoadingAtom,
} from '@/shared';
import { NAV_GROUPS } from '../model/nav-items';

interface SidebarNavProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

const SidebarNav = ({ collapsed, onNavigate }: SidebarNavProps) => {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wide text-(--ink-tertiary)">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex h-9 items-center gap-2.5 rounded-lg border-l-[3px] px-2.5 text-sm font-medium',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info)',
                    isActive
                      ? 'border-(--accent) bg-(--accent-soft) text-(--ink)'
                      : 'border-transparent text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
};

interface SidebarUserMenuProps {
  collapsed: boolean;
}

const SidebarUserMenu = ({ collapsed }: SidebarUserMenuProps) => {
  const router = useRouter();
  const [user, setUser] = useAtom(userAtom);
  const isLoading = useAtomValue(userLoadingAtom);
  const [, setIsInitialized] = useAtom(userInitializedAtom);
  const [, resetCafes] = useAtom(resetCafesAtom);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsInitialized(false);
    resetCafes();
    setIsOpen(false);
    router.push('/login');
    router.refresh();
  };

  if (isLoading) {
    return <div className="h-11" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium',
          'text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)'
        )}
      >
        <Users className="h-4 w-4 shrink-0" strokeWidth={2} />
        {!collapsed && <span>로그인</span>}
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label="사용자 메뉴"
          className={cn(
            'absolute bottom-full left-0 z-50 mb-2 w-56',
            'rounded-lg border border-(--border) bg-(--surface) py-1 shadow-lg'
          )}
        >
          <div className="border-b border-(--border-light) px-3 py-2">
            <p className="truncate text-sm font-medium text-(--ink)">{user.displayName}</p>
            <p className="mt-0.5 truncate text-xs text-(--ink-muted)">{user.userId}</p>
          </div>
          <div className="py-1">
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex h-9 items-center gap-2 px-3 text-sm text-(--ink-muted) transition-colors hover:bg-(--surface-muted) hover:text-(--ink)"
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} />
              설정
            </Link>
            <Link
              href="/accounts"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex h-9 items-center gap-2 px-3 text-sm text-(--ink-muted) transition-colors hover:bg-(--surface-muted) hover:text-(--ink)"
            >
              <Users className="h-4 w-4" strokeWidth={1.75} />
              계정 관리
            </Link>
          </div>
          <div className="border-t border-(--border-light) pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex h-9 w-full items-center gap-2 px-3 text-sm text-(--danger) transition-colors hover:bg-(--danger-soft)"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              로그아웃
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
        title={collapsed ? user.displayName : undefined}
        className={cn(
          'flex h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm',
          'text-(--ink-muted) transition-colors hover:bg-(--surface-muted) hover:text-(--ink)',
          isOpen && 'bg-(--surface-muted) text-(--ink)'
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) text-xs font-semibold text-(--accent)">
          {user.displayName.slice(0, 1)}
        </span>
        {!collapsed && (
          <React.Fragment>
            <span className="min-w-0 flex-1 truncate text-left font-medium">{user.displayName}</span>
            <ChevronUp
              className={cn('h-3.5 w-3.5 shrink-0 transition-transform', !isOpen && 'rotate-180')}
              strokeWidth={2}
            />
          </React.Fragment>
        )}
      </button>
    </div>
  );
};

interface SidebarBodyProps {
  collapsed: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

const SidebarBody = ({ collapsed, onNavigate, onToggleCollapse, onClose }: SidebarBodyProps) => (
  <React.Fragment>
    <div className="flex h-14 shrink-0 items-center justify-between px-3">
      <Link href="/" aria-label="Viro 홈" onClick={onNavigate} className="min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info)">
        {collapsed ? <LogoMark size={28} /> : <Logo size={28} />}
      </Link>
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      )}
    </div>

    <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />

    <div className="shrink-0 border-t border-(--border-light) p-3">
      <SidebarUserMenu collapsed={collapsed} />
    </div>
  </React.Fragment>
);

export const AppSidebar = () => {
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
  const [mobileOpen, setMobileOpen] = useAtom(mobileSidebarOpenAtom);

  return (
    <React.Fragment>
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-(--border-light) bg-(--surface) md:flex"
      >
        <SidebarBody collapsed={collapsed} onToggleCollapse={() => setCollapsed((prev) => !prev)} />
      </motion.aside>

      <Drawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        widthClassName="max-w-[280px]"
        side="left"
        hideHeader
        padding="none"
      >
        <div className="flex h-full flex-col">
          <SidebarBody
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
            onClose={() => setMobileOpen(false)}
          />
        </div>
      </Drawer>
    </React.Fragment>
  );
};
