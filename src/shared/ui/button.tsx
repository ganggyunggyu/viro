'use client';

import { cn } from '@/shared/lib/cn';
import { LoadingDots } from './loading-dots';
import React, { type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'teal';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))]',
    'text-background shadow-[0_12px_30px_rgba(0,0,0,0.15)]',
    'hover:brightness-105'
  ),
  secondary: cn(
    'border border-border bg-surface-muted',
    'text-ink hover:bg-surface'
  ),
  ghost: cn(
    'text-ink-muted hover:text-ink hover:bg-surface-muted'
  ),
  danger: cn(
    'bg-danger text-background',
    'shadow-[0_10px_24px_rgba(181,65,50,0.35)]',
    'hover:brightness-105'
  ),
  warning: cn(
    'bg-warning text-background',
    'shadow-[0_10px_24px_rgba(217,119,6,0.35)]',
    'hover:brightness-105'
  ),
  teal: cn(
    'bg-[linear-gradient(135deg,var(--teal),var(--teal-strong))]',
    'text-background shadow-[0_10px_24px_rgba(31,111,103,0.35)]',
    'hover:brightness-105'
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'min-h-8 min-w-8 px-2.5 py-1 text-xs rounded-lg',
  sm: 'min-h-9 min-w-9 px-3 py-1.5 text-sm rounded-lg',
  md: 'min-h-11 min-w-11 px-4 py-2 text-sm rounded-xl',
  lg: 'min-h-12 min-w-12 px-5 py-2.5 text-base rounded-xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold',
        'transition-[background-color,border-color,color,box-shadow,filter,transform] duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
        'active:translate-y-px',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'disabled:active:translate-y-0',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <LoadingDots size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} />
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';
