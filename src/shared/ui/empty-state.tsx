import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from './button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) => (
  <div className={cn('flex flex-col items-center gap-3 px-6 py-16 text-center', className)}>
    {Icon && (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-muted) text-(--ink-tertiary)">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
    )}
    <div className="space-y-1">
      <p className="text-sm font-medium text-(--ink)">{title}</p>
      {description && <p className="text-sm text-(--ink-muted)">{description}</p>}
    </div>
    {actionLabel && onAction && (
      <Button variant="secondary" size="sm" onClick={onAction} className="mt-2">
        {actionLabel}
      </Button>
    )}
  </div>
);
