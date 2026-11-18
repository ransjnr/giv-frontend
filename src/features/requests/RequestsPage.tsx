import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { MessageCircleIcon, SearchIcon, XIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { StatusFilter } from '@/components/status-filter';
import { DataTable, Pagination, ROW_LINK, useListParams, type Column } from '@/components/data-table';
import { EmptyState, ErrorState, PageHeader, TableSkeleton, usePageTitle } from '@/components/page';
import { NeededBy, RequestStatusBadge, UrgencyBadge } from '@/components/StatusBadge';
import { FilterSelect } from '@/features/registrations/RegistrationsPage';
import { useRequests, useStats } from '@/api/queries';
import type { RequestListQuery, RequestSummary } from '@/api/admin';
import { REQUEST_CATEGORIES, URGENCY } from '@/api/schema';
import { requestCategoryLabels } from '@/content/options';
import { urgencyLabel } from '@/content/staff';
import { timeAgo, formatDate } from '@/lib/format';

const DEFAULTS = { status: 'active', sort: 'updated', dir: 'desc', page: '1', pageSize: '25' };
const isActive = (r: RequestSummary) => r.status === 'open' || r.status === 'in_progress';

const columns: Column<RequestSummary>[] = [
  {
    id: 'request',
    header: 'Request',
    cell: (r) => (
      <div className="max-w-[12rem] min-w-0 sm:max-w-md">
        <Link
          to={`/requests/${r.id}`}
          className={ROW_LINK}
        >
          {r.title}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          <span className="tabular-nums">{r.id}</span> · {requestCategoryLabels[r.category].label}
        </p>
        {r.urgency !== 'normal' && (
          <div className="mt-1 md:hidden">
            <UrgencyBadge urgency={r.urgency} />
          </div>
        )}
      </div>
    ),
    className: 'whitespace-normal',
  },
  {
    id: 'student',
    header: 'Student',
    cell: (r) => (
      <div className="min-w-0">
        <p className="truncate">{r.studentName}</p>
        <p className="truncate text-sm text-muted-foreground">{r.programme}</p>
      </div>
    ),
    hideBelow: 'md',
  },
  { id: 'urgency', header: 'Urgency', sort: 'urgency', cell: (r) => <UrgencyBadge urgency={r.urgency} />, hideBelow: 'md' },
  {
    id: 'neededBy',
    header: 'Needed by',
    sort: 'neededBy',
    cell: (r) => <NeededBy neededBy={r.neededBy} active={isActive(r)} />,
    hideBelow: 'lg',
  },
  {
    id: 'status',
    header: 'Status',
    cell: (r) => (
      <div className="flex flex-col items-start gap-1">
        <RequestStatusBadge status={r.status} />
        {r.awaitingReply && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-800 dark:text-sky-300">
            <MessageCircleIcon aria-hidden className="size-3.5 shrink-0" /> Awaiting reply
          </span>
        )}
      </div>
    ),
    className: 'whitespace-normal pr-4',
  },
  {
    id: 'updated',
    header: 'Last activity',
    sort: 'updated',
    cell: (r) => (
      <time dateTime={r.updatedAt} title={formatDate(r.updatedAt)} className="text-muted-foreground">
        {timeAgo(r.updatedAt)}
      </time>
    ),
    hideBelow: 'md',
  },
];

const STATUS_TABS = [
  { value: 'active', label: 'Active' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'all', label: 'All' },
] as const;

export function RequestsPage() {
  usePageTitle('Support requests');
  const { get, set } = useListParams(DEFAULTS);
  const stats = useStats().data;

  const statusParam = get('status');
  const awaiting = get('awaiting') === 'true';
  const query: RequestListQuery = {
    status: statusParam === 'all' ? undefined : (statusParam as RequestListQuery['status']),
    category: get('category') as RequestListQuery['category'],
    urgency: get('urgency') as RequestListQuery['urgency'],
    awaiting: awaiting ? 'true' : undefined,
    q: get('q'),
    sort: get('sort') as RequestListQuery['sort'],
    dir: get('dir') as 'asc' | 'desc',
    page: Number(get('page')),
    pageSize: Number(get('pageSize')),
  };
  const { data, error, refetch, isPending, isFetching } = useRequests(query);

  const [text, setText] = useState(query.q ?? '');
  useEffect(() => {
    const t = setTimeout(() => {
      if ((query.q ?? '') !== text.trim()) set({ q: text.trim() || undefined });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const filtered = !!(query.q || query.category || query.urgency || awaiting);
  const tabCount = (v: (typeof STATUS_TABS)[number]['value']) => {
    if (!stats) return undefined;
    const r = stats.requests;
    return { active: r.open + r.in_progress, open: r.open, in_progress: r.in_progress, resolved: r.resolved, withdrawn: r.withdrawn, all: r.open + r.in_progress + r.resolved + r.withdrawn }[v];
  };

  return (
    <>
      <PageHeader
        title="Support requests"
        description="Specific things students have asked GIV for, such as exam arrangements or an accessible room."
      />

      <StatusFilter
        label="Show requests by status"
        value={statusParam ?? 'active'}
        onChange={(v) => set({ status: v })}
        options={STATUS_TABS.map((t) => ({ value: t.value, label: t.label, count: tabCount(t.value) }))}
      />

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-end gap-3 border-b p-4">
          <div className="relative min-w-56 flex-1">
            <label htmlFor="req-search" className="sr-only">
              Search by title, request ID, student name or ID
            </label>
            <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="req-search"
              type="search"
              placeholder="Search title, REQ-0001, student name or ID"
              className="pl-9"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <FilterSelect
            label="Category"
            value={query.category}
            options={REQUEST_CATEGORIES.map((c) => ({ value: c, label: requestCategoryLabels[c].label }))}
            onChange={(v) => set({ category: v })}
            className="w-52"
          />
          <FilterSelect
            label="Urgency"
            value={query.urgency}
            options={URGENCY.map((u) => ({ value: u, label: urgencyLabel[u] }))}
            onChange={(v) => set({ urgency: v })}
            className="w-36"
          />
          <div className="flex h-9 items-center gap-2">
            <Checkbox
              id="awaiting"
              checked={awaiting}
              onCheckedChange={(c) => set({ awaiting: c === true ? 'true' : undefined })}
            />
            <Label htmlFor="awaiting" className="font-normal">
              Waiting for a reply
            </Label>
          </div>
          {filtered && (
            <Button
              variant="ghost"
              onClick={() => {
                setText('');
                set({ q: undefined, category: undefined, urgency: undefined, awaiting: undefined });
              }}
            >
              <XIcon aria-hidden /> Clear filters
            </Button>
          )}
        </div>

        {error && !data ? (
          <div className="p-4">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : isPending ? (
          <TableSkeleton />
        ) : (
          <>
            <DataTable
              caption="Support requests. Select a request's title to open it."
              columns={columns}
              rows={data.items}
              rowKey={(r) => r.id}
              sort={query.sort!}
              dir={query.dir!}
              onSort={(sort, dir) => set({ sort, dir })}
              busy={isFetching}
              emptyState={
                <EmptyState
                  title={filtered ? 'No requests match' : 'No requests here'}
                  description={
                    filtered ? 'Try a different search or clear the filters.' : 'Requests students send appear here.'
                  }
                />
              }
            />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              noun="requests"
              onPage={(p) => set({ page: String(p) }, { resetPage: false })}
              onPageSize={(n) => set({ pageSize: String(n) })}
            />
          </>
        )}
      </Card>
    </>
  );
}
