'use client';

import { useAtom } from 'jotai';
import { Menu, Search } from 'lucide-react';
import { cn, commandPaletteOpenAtom, mobileSidebarOpenAtom, ThemeToggle } from '@/shared';
import { CommandPalette } from './command-palette';

export const AppTopbar = () => {
  const [, setMobileOpen] = useAtom(mobileSidebarOpenAtom);
  const [, setCommandPaletteOpen] = useAtom(commandPaletteOpenAtom);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-(--border-light)',
        'bg-(--surface)/95 px-4 backdrop-blur-xl lg:px-6'
      )}
    >
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="메뉴 열기"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink) md:hidden"
      >
        <Menu className="h-4 w-4" strokeWidth={2} />
      </button>

      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className={cn(
          'flex h-9 max-w-xs flex-1 items-center gap-2 rounded-lg border border-(--border-light)',
          'bg-(--surface-muted) px-3 text-sm text-(--ink-tertiary) transition-colors hover:text-(--ink-muted)'
        )}
      >
        <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <span className="truncate">페이지 검색</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-(--border) px-1.5 py-0.5 text-[10px] font-medium sm:block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <ThemeToggle />
      </div>

      <CommandPalette />
    </header>
  );
};
