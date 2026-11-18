import { useCallback, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * List state (filters, sort, page) lives in the URL, so a filtered view can be bookmarked,
 * shared with a colleague, and survives going back from a detail page.
 */
export function useListParams<K extends string>(defaults: Partial<Record<K | 'sort' | 'dir' | 'page' | 'pageSize', string>>) {
  const [params, setParams] = useSearchParams();
  const get = useCallback((k: string) => params.get(k) ?? defaults[k as K] ?? undefined, [params, defaults]);
  const set = useCallback(
    (changes: Record<string, string | undefined>, opts: { resetPage?: boolean } = { resetPage: true }) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(changes)) {
            if (v === undefined || v === '' || v === defaults[k as K]) next.delete(k);
            else next.set(k, v);
          }
          if (opts.resetPage && !('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams, defaults],
  );
  return { get, set, params };
}

export type Column<T> = {
  id: string;
  header: string;
  /** Server sort key, if this column can be sorted. */
  sort?: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide below a breakpoint to keep the table readable on small screens. */
  hideBelow?: 'md' | 'lg' | 'xl';
};

const HIDE = { md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' } as const;

/**
 * For the main link in a row: its click area stretches over the whole row, and the keyboard
 * focus ring is drawn around the row (rows get `position: relative` in DataTable).
 */
export const ROW_LINK =
  'font-medium underline-offset-4 outline-none group-hover:underline after:absolute after:inset-0 after:rounded-sm focus-visible:underline focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring';

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  sort,
  dir,
  onSort,
  emptyState,
  busy,
}: {
  /** Describes the table for screen readers. */
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sort: string;
  dir: 'asc' | 'desc';
  onSort: (sort: string, dir: 'asc' | 'desc') => void;
  emptyState: ReactNode;
  busy?: boolean;
}) {
  if (rows.length === 0) return <div className="p-4">{emptyState}</div>;
  return (
    <Table aria-busy={busy || undefined} className={cn(busy && 'opacity-60 transition-opacity')}>
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((c) => {
            const active = c.sort && c.sort === sort;
            return (
              <TableHead
                key={c.id}
                scope="col"
                aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
                className={cn('h-11 first:pl-4', c.hideBelow && HIDE[c.hideBelow], c.className)}
              >
                {c.sort ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 gap-1.5 font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => onSort(c.sort!, active && dir === 'desc' ? 'asc' : 'desc')}
                  >
                    {c.header}
                    {active ? (
                      dir === 'asc' ? (
                        <ArrowUpIcon aria-hidden className="size-3.5" />
                      ) : (
                        <ArrowDownIcon aria-hidden className="size-3.5" />
                      )
                    ) : (
                      <ArrowUpDownIcon aria-hidden className="size-3.5 opacity-50" />
                    )}
                    <span className="sr-only">, sort</span>
                  </Button>
                ) : (
                  <span className="font-medium text-muted-foreground">{c.header}</span>
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={rowKey(row)} className="group relative">
            {columns.map((c) => (
              <TableCell key={c.id} className={cn('py-3 first:pl-4', c.hideBelow && HIDE[c.hideBelow], c.className)}>
                {c.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  noun,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
  noun: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const sizes = useMemo(() => [10, 25, 50, 100], []);
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
      <p className="text-muted-foreground" aria-live="polite">
        {total === 0 ? `No ${noun}` : `Showing ${from}–${to} of ${total.toLocaleString('en-GB')} ${noun}`}
      </p>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <span id="rows-per-page" className="text-muted-foreground">
            Rows per page
          </span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSize(Number(v))}>
            <SelectTrigger size="sm" className="w-20" aria-labelledby="rows-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="tabular-nums">
          Page {page} of {pages}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            <ChevronLeftIcon aria-hidden />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button variant="outline" size="icon" className="size-8" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            <ChevronRightIcon aria-hidden />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
