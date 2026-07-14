'use client';

import React, { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  hideLabel?: boolean;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  errorText,
  hideLabel = false,
  id,
  className,
  containerClassName,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const describedBy = [errorText && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn('mb-1.5 block text-sm font-medium text-(--ink)', hideLabel && 'sr-only')}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={errorText ? true : undefined}
        className={cn(
          'min-h-11 w-full rounded-xl border bg-(--background) px-4 py-2 text-sm text-(--ink)',
          'transition-colors placeholder:text-(--ink-tertiary)',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info)/20 focus-visible:border-(--info)',
          errorText ? 'border-(--danger)' : 'border-(--border-light)',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
        {...props}
      />
      {errorText ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-(--danger)">
          {errorText}
        </p>
      ) : helperText ? (
        <p id={helperId} className="mt-1.5 text-xs text-(--ink-muted)">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
