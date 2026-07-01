import { cn } from '@/shared';
import { AppHeader } from './app-header';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
}

export const PageLayout = ({ children, title, subtitle, description }: PageLayoutProps) => {
  return (
    <div className={cn('min-h-screen bg-(--background)')}>
      <AppHeader />

      <main className={cn('mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8')}>
        <header className={cn('mb-6 border-b border-(--border-light) pb-5 sm:mb-8 sm:pb-6')}>
          {subtitle && (
            <p className={cn('text-xs font-semibold uppercase tracking-[0.16em] text-(--info)')}>
              {subtitle}
            </p>
          )}
          <h1
            className={cn(
              'mt-1 text-2xl font-semibold text-(--ink) sm:text-3xl'
            )}
          >
            {title}
          </h1>
          {description && (
            <p className={cn('mt-2 max-w-3xl text-sm leading-6 text-(--ink-muted) sm:text-base')}>
              {description}
            </p>
          )}
        </header>

        <div>{children}</div>
      </main>
    </div>
  );
};
