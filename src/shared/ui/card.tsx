import React from 'react';
import { cn } from '@/shared/lib/cn';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
}

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = ({ className, padding = 'md', ...props }: CardProps) => (
  <div
    className={cn(
      'rounded-2xl border border-(--border-light) bg-(--surface)',
      paddingStyles[padding],
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4 flex items-start justify-between gap-3', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-base font-semibold text-(--ink)', className)} {...props} />
);

export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('mt-1 text-sm text-(--ink-muted)', className)} {...props} />
);
