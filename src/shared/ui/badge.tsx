import React from 'react';
import { cn } from '@/shared/lib/cn';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
  mono?: boolean;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-(--success-soft) text-(--success)',
  danger: 'bg-(--danger-soft) text-(--danger)',
  warning: 'bg-(--warning-soft) text-(--warning)',
  info: 'bg-(--info-soft) text-(--info)',
  neutral: 'bg-(--surface-muted) text-(--ink-muted)',
};

const dotStyles: Record<BadgeVariant, string> = {
  success: 'bg-(--success)',
  danger: 'bg-(--danger)',
  warning: 'bg-(--warning)',
  info: 'bg-(--info)',
  neutral: 'bg-(--ink-tertiary)',
};

export const Badge = ({ variant = 'neutral', className, children, mono = false, dot = false }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
      mono && 'font-mono',
      variantStyles[variant],
      className
    )}
  >
    {dot && <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotStyles[variant])} />}
    {children}
  </span>
);
