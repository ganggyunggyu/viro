'use client';

import React, { useEffect, useId, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/cn';
import { Button } from './button';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  children?: ReactNode;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'info',
  confirmText = '확인',
  cancelText = '취소',
  isLoading = false,
  children,
}: ConfirmModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(isLoading);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;

    const getFocusableElements = () => {
      if (!dialogRef.current) return [];

      return Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => element.offsetParent !== null || element === document.activeElement);
    };

    const animationFrame = window.requestAnimationFrame(() => {
      const [firstFocusableElement] = getFocusableElements();
      (firstFocusableElement ?? dialogRef.current)?.focus();
    });

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoadingRef.current) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleDocumentKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('keydown', handleDocumentKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previousActiveElement?.focus();
    };
  }, [isOpen, onClose]);

  const iconByVariant = {
    danger: (
      <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    warning: (
      <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    info: (
      <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  const colorByVariant = {
    danger: {
      icon: 'text-danger bg-danger/10',
      button: 'danger' as const,
    },
    warning: {
      icon: 'text-warning bg-warning/10',
      button: 'warning' as const,
    },
    info: {
      icon: 'text-accent bg-accent/10',
      button: 'primary' as const,
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn('fixed inset-0 z-50 bg-black/50 backdrop-blur-sm')}
            onClick={() => !isLoading && onClose()}
          />

          {/* Modal */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
              'rounded-2xl border border-border bg-surface p-6 shadow-xl'
            )}
          >
            {/* Header */}
            <div className={cn('flex items-start gap-4')}>
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                  colorByVariant[variant].icon
                )}
              >
                {iconByVariant[variant]}
              </div>
              <div className={cn('flex-1 pt-1')}>
                <h3 id={titleId} className={cn('text-lg font-semibold text-ink')}>{title}</h3>
                {description && (
                  <p id={descriptionId} className={cn('mt-1 text-sm text-ink-muted')}>{description}</p>
                )}
              </div>
            </div>

            {/* Content */}
            {children && <div className={cn('mt-4')}>{children}</div>}

            {/* Actions */}
            <div className={cn('mt-6 flex gap-3')}>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                className={cn('flex-1')}
              >
                {cancelText}
              </Button>
              <Button
                variant={colorByVariant[variant].button}
                onClick={onConfirm}
                isLoading={isLoading}
                className={cn('flex-1')}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

// 실행 전 설정 확인 모달
export interface SettingItem {
  label: string;
  value: string | number | boolean;
  highlight?: boolean;
}

export interface ExecuteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  settings: SettingItem[];
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  warnings?: string[];
}

export const ExecuteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  settings,
  confirmText = '실행',
  cancelText = '취소',
  isLoading = false,
  warnings = [],
}: ExecuteConfirmModalProps) => {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      variant={warnings.length > 0 ? 'warning' : 'info'}
      confirmText={confirmText}
      cancelText={cancelText}
      isLoading={isLoading}
    >
      <div className={cn('space-y-3')}>
        {/* 설정 요약 */}
        <div className={cn('rounded-xl border border-border bg-surface-muted p-4')}>
          <h4 className={cn('text-sm font-medium text-ink mb-3')}>실행 설정</h4>
          <div className={cn('space-y-2')}>
            {settings.map((item, i) => (
              <div key={i} className={cn('flex items-center justify-between text-sm')}>
                <span className={cn('text-ink-muted')}>{item.label}</span>
                <span
                  className={cn(
                    'font-medium',
                    item.highlight ? 'text-accent' : 'text-ink'
                  )}
                >
                  {typeof item.value === 'boolean'
                    ? item.value
                      ? '사용'
                      : '사용 안함'
                    : item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 경고 메시지 */}
        {warnings.length > 0 && (
          <div className={cn('rounded-xl border border-warning/30 bg-warning-soft p-4')}>
            <h4 className={cn('text-sm font-medium text-warning mb-2')}>주의사항</h4>
            <ul className={cn('text-sm text-warning/80 space-y-1')}>
              {warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ConfirmModal>
  );
};
