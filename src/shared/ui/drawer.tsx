'use client';

import React, { useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useFocusTrap } from '@/shared/hooks/use-focus-trap';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  widthClassName?: string;
  /** Suppress the built-in title/close bar for consumers that render their own chrome. */
  hideHeader?: boolean;
  /** 'none' lets full-bleed content (e.g. a nav sidebar) manage its own spacing. */
  padding?: 'none' | 'md';
  /** Which edge the panel slides in from. 'right' for detail views, 'left' for nav panels. */
  side?: 'left' | 'right';
}

export const Drawer = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  widthClassName = 'max-w-md',
  hideHeader = false,
  padding = 'md',
  side = 'right',
}: DrawerProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useFocusTrap<HTMLDivElement>({ isOpen, onClose });
  const offscreenX = side === 'right' ? '100%' : '-100%';

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ x: offscreenX }}
            animate={{ x: 0 }}
            exit={{ x: offscreenX }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'fixed inset-y-0 z-50 flex w-full flex-col bg-(--surface) shadow-xl',
              side === 'right' ? 'right-0 border-l border-(--border)' : 'left-0 border-r border-(--border)',
              widthClassName
            )}
          >
            {!hideHeader && (
              <div className="flex items-start justify-between gap-3 border-b border-(--border-light) px-6 py-5">
                <div className="min-w-0">
                  {title && (
                    <h3 id={titleId} className="truncate text-base font-semibold text-(--ink)">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p id={descriptionId} className="mt-1 text-sm text-(--ink-muted)">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="닫기"
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-(--ink-muted)',
                    'hover:bg-(--surface-muted) hover:text-(--ink)',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info)'
                  )}
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            )}

            <div className={cn('flex-1 overflow-y-auto', padding === 'md' && 'px-6 py-5')}>
              {children}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
