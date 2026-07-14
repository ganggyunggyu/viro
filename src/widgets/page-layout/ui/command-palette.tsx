'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { cn, commandPaletteOpenAtom } from '@/shared';
import { useFocusTrap } from '@/shared/hooks/use-focus-trap';
import { NAV_GROUPS, type NavItem } from '../model/nav-items';

interface FlatItem extends NavItem {
  group: string;
}

const FLAT_ITEMS: FlatItem[] = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label }))
);

export const CommandPalette = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useAtom(commandPaletteOpenAtom);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputId = useId();

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, [setIsOpen]);

  const panelRef = useFocusTrap<HTMLDivElement>({ isOpen, onClose: handleClose });

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setIsOpen]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return FLAT_ITEMS;
    return FLAT_ITEMS.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [query]);

  const safeActiveIndex = Math.min(activeIndex, Math.max(results.length - 1, 0));

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setActiveIndex(0);
  };

  const handleNavigate = (href: string) => {
    handleClose();
    router.push(href);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = results[safeActiveIndex];
      if (target) handleNavigate(target.href);
    }
  };

  let lastRenderedGroup = '';

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="커맨드 팔레트"
            tabIndex={-1}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed left-1/2 top-24 z-[60] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-(--border) bg-(--surface) shadow-xl"
          >
            <div className="flex items-center gap-2.5 border-b border-(--border-light) px-4">
              <Search className="h-4 w-4 shrink-0 text-(--ink-tertiary)" strokeWidth={2} />
              <label htmlFor={inputId} className="sr-only">
                페이지 검색
              </label>
              <input
                id={inputId}
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleInputKeyDown}
                placeholder="이동할 페이지 검색..."
                className="h-12 w-full bg-transparent text-sm text-(--ink) placeholder:text-(--ink-tertiary) focus:outline-none"
              />
              <kbd className="hidden shrink-0 rounded border border-(--border) px-1.5 py-0.5 text-[10px] font-medium text-(--ink-tertiary) sm:block">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-(--ink-muted)">검색 결과가 없습니다</p>
              ) : (
                results.map((item, index) => {
                  const Icon = item.icon;
                  const showGroupLabel = item.group !== lastRenderedGroup;
                  lastRenderedGroup = item.group;

                  return (
                    <React.Fragment key={item.href}>
                      {showGroupLabel && (
                        <p className="mt-2 px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-(--ink-tertiary) first:mt-0">
                          {item.group}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => handleNavigate(item.href)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          'flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm transition-colors',
                          index === safeActiveIndex
                            ? 'bg-(--accent-soft) text-(--ink)'
                            : 'text-(--ink-muted) hover:bg-(--surface-muted)'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                        {item.label}
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
