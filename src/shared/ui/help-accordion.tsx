'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface HelpAccordionProps {
  title?: string;
  items?: string[];
  children?: ReactNode;
  className?: string;
}

export const HelpAccordion = ({ title = '사용 방법', items, children, className }: HelpAccordionProps) => {
  return (
    <details className={cn('group', className)}>
      <summary
        className={cn(
          'flex items-center gap-2 cursor-pointer text-sm text-(--ink-muted) hover:text-(--ink) transition',
          'list-none [&::-webkit-details-marker]:hidden',
        )}
      >
        <svg
          className={cn('w-4 h-4 transition-transform group-open:rotate-90')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {title}
      </summary>

      <div className={cn('mt-3 rounded-xl border border-(--border-light) bg-(--surface-muted) p-5')}>
        {items ? (
          <ol className={cn('text-sm text-(--ink-muted) space-y-2 list-decimal list-inside')}>
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        ) : (
          children
        )}
      </div>
    </details>
  );
};
