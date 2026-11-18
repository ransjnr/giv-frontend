import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SearchIcon, XIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusFilter } from '@/components/status-filter';
import { DataTable, Pagination, ROW_LINK, useListParams, type Column } from '@/components/data-table';
import { EmptyState, ErrorState, PageHeader, TableSkeleton, usePageTitle } from '@/components/page';
import { RegistrationStatusBadge } from '@/components/StatusBadge';
import { useRegistrations, useStats } from '@/api/queries';
import type { RegistrationListQuery, RegistrationSummary } from '@/api/admin';
import { registrationStatus, REGISTRATION_FLOW, type ActiveRegistrationStatus } from '@/content/staff';
import { formatDate, timeAgo } from '@/lib/format';

const DEFAULTS = { sort: 'updated', dir: 'desc', page: '1', pageSize: '25' };
const ALL = '__all';

const columns: Column<RegistrationSummary>[] = [
  {
    id: 'student',
    header: 'Student',
    sort: 'name',
    cell: (r) => (
      <div className="min-w-0">
        <Link
          to={`/registrations/${r.studentId}`}
          className={ROW_LINK}
        >
          {r.fullName}
        </Link>
        <p className="text-sm text-muted-foreground tabular-nums">{r.studentId}</p>
      </div>
    ),
    className: 'whitespace-normal',
  },
  {
    id: 'programme',
    header: 'Programme',
    cell: (r) => (
      <div className="max-w-72 min-w-0">
        <p className="truncate">{r.programme}</p>
        <p className="truncate text-sm text-muted-foreground">{r.college.replace(/^College of /, '')}</p>
      </div>
    ),
    hideBelow: 'md',
  },
  { id: 'level', header: 'Level', cell: (r) => <span className="tabular-nums">{r.level}</span>, hideBelow: 'lg' },
  { id: 'status', header: 'Status', cell: (r) => <RegistrationStatusBadge status={r.status as ActiveRegistrationStatus} /> },
  {
    id: 'submitted',
    header: 'Sent',
    sort: 'submitted',
    cell: (r) => <time dateTime={r.submittedAt}>{formatDate(r.submittedAt)}</time>,
    hideBelow: 'lg',
  },
  {
    id: 'updated',
    header: 'Last update',
    sort: 'updated',
    cell: (r) => (
      <time dateTime={r.updatedAt} title={formatDate(r.updatedAt)} className="text-muted-foreground">
        {timeAgo(r.updatedAt)}
      </time>
    ),
    hideBelow: 'md',
  },
];

export function RegistrationsPage() {
  usePageTitle('Registrations');
  const { get, set } = useListParams(DEFAULTS);
  const stats = useStats().data;

  const query: RegistrationListQuery = {
    status: (get('status') as ActiveRegistrationStatus | undefined) ?? undefined,
    q: get('q'),
    college: get('college'),
    level: get('level'),
    sort: get('sort') as RegistrationListQuery['sort'],
    dir: get('dir') as 'asc' | 'desc',
    page: Number(get('page')),
    pageSize: Number(get('pageSize')),
  };
  const { data, error, refetch, isPending, isFetching } = useRegistrations(query);

  // Search box: update the URL once typing pauses.
  const [text, setText] = useState(query.q ?? '');
  useEffect(() => {
    const t = setTimeout(() => {
      if ((query.q ?? '') !== text.trim()) set({ q: text.trim() || undefined });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const filtered = !!(query.q || query.college || query.level);
  const count = (s?: ActiveRegistrationStatus) =>
    stats ? (s ? stats.registrations[s] : stats.registrations.total) : undefined;

  return (
    <>
      <PageHeader
        title="Registrations"
        description="Students who have sent their details to the GIV Office. Unsent drafts are never shown."
      />

      <StatusFilter
        label="Show registrations by status"
        value={query.status ?? ALL}
        onChange={(v) => set({ status: v === ALL ? undefined : v })}
        options={[undefined, ...REGISTRATION_FLOW].map((s) => ({
          value: s ?? ALL,
          label: s ? registrationStatus[s].label : 'All',
          count: count(s),
        }))}
      />

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-end gap-3 border-b p-4">
          <div className="relative min-w-56 flex-1">
            <label htmlFor="reg-search" className="sr-only">
              Search by name or student ID
            </label>
            <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="reg-search"
              type="search"
              placeholder="Search by name or student ID"
              className="pl-9"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <FilterSelect
            label="College"
            value={query.college}
            options={(data?.facets.colleges ?? []).map((c) => ({ value: c, label: c.replace(/^College of /, '') }))}
            onChange={(v) => set({ college: v })}
            className="w-56"
          />
          <FilterSelect
            label="Level"
            value={query.level}
            options={(data?.facets.levels ?? []).map((l) => ({ value: l, label: `Level ${l}` }))}
            onChange={(v) => set({ level: v })}
            className="w-36"
          />
          {filtered && (
            <Button
              variant="ghost"
              onClick={() => {
                setText('');
                set({ q: undefined, college: undefined, level: undefined });
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
              caption="Registrations. Select a student's name to open their registration."
              columns={columns}
              rows={data.items}
              rowKey={(r) => r.studentId}
              sort={query.sort!}
              dir={query.dir!}
              onSort={(sort, dir) => set({ sort, dir })}
              busy={isFetching}
              emptyState={
                <EmptyState
                  title={filtered || query.status ? 'No registrations match' : 'No registrations yet'}
                  description={
                    filtered || query.status
                      ? 'Try a different search or clear the filters.'
                      : 'When students send their registration, it appears here.'
                  }
                />
              }
            />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              noun="registrations"
              onPage={(p) => set({ page: String(p) }, { resetPage: false })}
              onPageSize={(n) => set({ pageSize: String(n) })}
            />
          </>
        )}
      </Card>
    </>
  );
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (v: string | undefined) => void;
  className?: string;
}) {
  const id = `filter-${label.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <div className="grid gap-1.5">
      <span id={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
        <SelectTrigger className={className} aria-labelledby={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
