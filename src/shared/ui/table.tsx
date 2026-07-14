import React from 'react';
import { cn } from '@/shared/lib/cn';

export const Table = ({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-x-auto rounded-2xl border border-(--border-light) bg-(--surface)">
    <table className={cn('w-full border-collapse text-sm', className)} {...props} />
  </div>
);

export const TableHead = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead
    className={cn(
      'sticky top-0 z-10 bg-(--surface-muted) text-xs font-medium uppercase tracking-wide text-(--ink-muted)',
      className
    )}
    {...props}
  />
);

export const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn('divide-y divide-(--border-light)', className)} {...props} />
);

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  onClick?: () => void;
}

export const TableRow = ({ className, onClick, ...props }: TableRowProps) => (
  <tr
    onClick={onClick}
    className={cn(
      'transition-colors',
      onClick && 'cursor-pointer hover:bg-(--surface-muted)',
      className
    )}
    {...props}
  />
);

type TableCellAlign = 'left' | 'right' | 'center';

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: TableCellAlign;
  density?: 'dense' | 'normal';
  header?: boolean;
}

const alignStyles: Record<TableCellAlign, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

export const TableCell = ({
  className,
  align = 'left',
  density = 'normal',
  header = false,
  ...props
}: TableCellProps) => {
  const Component = header ? 'th' : 'td';

  return (
    <Component
      className={cn(
        'px-4 text-(--ink)',
        density === 'dense' ? 'h-9' : 'h-12',
        header && 'font-medium text-(--ink-muted)',
        alignStyles[align],
        className
      )}
      {...props}
    />
  );
};
