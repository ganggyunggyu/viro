import { cn } from '@/shared/lib/cn';

interface LogoGlyphProps {
  className?: string;
}

export const LogoGlyph = ({ className }: LogoGlyphProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M4 11L9.5 18L20 4"
      stroke="currentColor"
      strokeWidth={2.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface LogoMarkProps {
  className?: string;
  size?: number;
}

export const LogoMark = ({ className, size = 32 }: LogoMarkProps) => (
  <div
    className={cn(
      'flex shrink-0 items-center justify-center rounded-lg bg-ink text-background',
      className
    )}
    style={{ width: size, height: size }}
  >
    <LogoGlyph className="h-[55%] w-[55%]" />
  </div>
);

interface LogoProps {
  variant?: 'mark' | 'wordmark';
  size?: number;
  className?: string;
}

export const Logo = ({ variant = 'wordmark', size = 32, className }: LogoProps) => {
  if (variant === 'mark') {
    return <LogoMark size={size} className={className} />;
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <LogoMark size={size} />
      <span className="truncate text-lg font-bold tracking-tight text-(--ink)">
        Viro
      </span>
    </div>
  );
};
