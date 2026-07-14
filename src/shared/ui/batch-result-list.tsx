import React from 'react';
import { CheckCircle2, Circle, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Badge, type BadgeVariant } from './badge';

export type BatchRowStatus = 'success' | 'neutral' | 'failure';

export interface BatchResultRow {
  status: BatchRowStatus;
  primaryLabel: string;
  secondaryLabel?: string;
  detail?: string;
  error?: string;
}

export interface BatchResultSummaryItem {
  label: string;
  value: number;
  variant?: BadgeVariant;
}

interface BatchResultListProps {
  success: boolean;
  title: string;
  failTitle?: string;
  summary: BatchResultSummaryItem[];
  rows: BatchResultRow[];
  className?: string;
}

const STATUS_ICON: Record<BatchRowStatus, LucideIcon> = {
  success: CheckCircle2,
  neutral: Circle,
  failure: XCircle,
};

const STATUS_COLOR: Record<BatchRowStatus, string> = {
  success: 'text-(--success)',
  neutral: 'text-(--ink-tertiary)',
  failure: 'text-(--danger)',
};

export const BatchResultList = ({
  success,
  title,
  failTitle = '일부 실패',
  summary,
  rows,
  className,
}: BatchResultListProps) => (
  <div
    className={cn(
      'rounded-2xl border px-4 py-4',
      success ? 'border-(--success) bg-(--success-soft)' : 'border-(--warning) bg-(--warning-soft)',
      className
    )}
  >
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className={cn('font-semibold', success ? 'text-(--success)' : 'text-(--warning)')}>
        {success ? title : failTitle}
      </h3>
      <div className="flex items-center gap-1.5">
        {summary.map((item) => (
          <Badge key={item.label} variant={item.variant ?? 'neutral'} mono>
            {item.label} {item.value}
          </Badge>
        ))}
      </div>
    </div>

    <div className="max-h-[300px] space-y-2 overflow-y-auto">
      {rows.map((row, index) => {
        const Icon = STATUS_ICON[row.status];
        return (
          <div
            key={index}
            className="rounded-xl border border-(--border) bg-(--surface-muted) px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4 shrink-0', STATUS_COLOR[row.status])} strokeWidth={2} />
              <span className="text-sm font-medium text-(--ink)">{row.primaryLabel}</span>
              {row.secondaryLabel && (
                <React.Fragment>
                  <span className="text-(--ink-muted)">→</span>
                  <span className="text-sm text-(--ink)">{row.secondaryLabel}</span>
                </React.Fragment>
              )}
            </div>
            {row.detail && <p className="mt-1 text-xs text-(--ink-muted)">{row.detail}</p>}
            {row.error && <p className="mt-1 text-xs text-(--danger)">{row.error}</p>}
          </div>
        );
      })}
    </div>
  </div>
);
