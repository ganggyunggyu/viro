'use client';

import { useState, useRef, useEffect, useId, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  placeholder?: string;
  label?: string;
  helperText?: ReactNode;
  error?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Select = ({
  options,
  value,
  onChange,
  placeholder = '선택하세요',
  label,
  helperText,
  error,
  fullWidth = true,
  disabled = false,
  className,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const buttonId = `${generatedId}-button`;
  const labelId = `${generatedId}-label`;
  const valueId = `${generatedId}-value`;
  const listboxId = `${generatedId}-listbox`;
  const helperId = helperText && !error ? `${generatedId}-helper` : undefined;
  const errorId = error ? `${generatedId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange?.({ target: { value: optionValue } });
    setIsOpen(false);
  };

  const selectByOffset = (offset: 1 | -1) => {
    if (options.length === 0) return;

    const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
    const nextIndex = (currentIndex + offset + options.length) % options.length;
    handleSelect(options[nextIndex].value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      selectByOffset(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      selectByOffset(-1);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', fullWidth && 'w-full')}>
      {label && (
        <span id={labelId} className={cn('mb-1 block text-sm font-medium text-(--ink)')}>
          {label}
        </span>
      )}

      <button
        id={buttonId}
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-labelledby={label ? `${labelId} ${valueId}` : valueId}
        aria-describedby={describedBy}
        className={cn(
          'flex min-h-11 items-center justify-between gap-2 rounded-xl border bg-(--surface) px-4 py-2.5 text-left text-sm transition-all',
          'border-(--border) hover:border-(--border-hover)',
          'focus-visible:border-(--info) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info)/20',
          'disabled:bg-(--surface-muted) disabled:cursor-not-allowed disabled:opacity-60',
          isOpen && 'border-(--accent) ring-2 ring-(--accent)/10',
          error && 'border-(--danger) focus:border-(--danger) focus:ring-(--danger)/10',
          fullWidth && 'w-full',
          className
        )}
      >
        <span id={valueId} className={cn('min-w-0 truncate', !selectedOption && 'text-(--ink-muted)')}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          aria-hidden="true"
          className={cn(
            'w-4 h-4 text-(--ink-muted) transition-transform shrink-0',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? labelId : buttonId}
          className={cn(
            'absolute z-50 mt-1 w-full rounded-xl border border-(--border) bg-(--surface) py-1 shadow-lg',
            'max-h-60 overflow-y-auto'
          )}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'w-full px-4 py-2.5 text-left text-sm transition-colors',
                'hover:bg-(--surface-muted) focus-visible:bg-(--surface-muted)',
                option.value === value
                  ? 'bg-(--accent-soft) text-(--accent) font-medium'
                  : 'text-(--ink)'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {helperText && !error && (
        <p id={helperId} className={cn('mt-1 text-xs text-(--ink-muted)')}>{helperText}</p>
      )}
      {error && (
        <p id={errorId} className={cn('mt-1 text-xs text-(--danger)')}>{error}</p>
      )}
    </div>
  );
};
