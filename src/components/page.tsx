import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { AlertCircleIcon, InboxIcon, RotateCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Sets the browser tab title. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | GIV Admin`;
  }, [title]);
}

/**
 * After each page change (not the first load), move focus to the new page's heading, so keyboard
 * and screen-reader users start at the new content and hear its name. Used once, in the layout.
 */
export function useFocusOnNavigate() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Detail pages show their heading once data arrives, so wait for it (up to 2 seconds),
    // then fall back to the main area.
    const started = Date.now();
    let frame = 0;
    const tryFocus = () => {
      const h1 = document.querySelector<HTMLElement>('main h1');
      if (h1) return h1.focus();
      if (Date.now() - started > 2000) return document.querySelector<HTMLElement>('main')?.focus();
      frame = requestAnimationFrame(tryFocus);
    };
    frame = requestAnimationFrame(tryFocus);
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
}

/** The page's heading and its actions. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0 space-y-1">
        {eyebrow}
        <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {description && <p className="max-w-3xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return (
    <Empty role="alert" className="border border-dashed border-destructive/40">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="text-destructive">
          <AlertCircleIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>We couldn't load this</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" onClick={onRetry}>
            <RotateCwIcon aria-hidden /> Try again
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

/** Placeholder rows while a table loads. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
