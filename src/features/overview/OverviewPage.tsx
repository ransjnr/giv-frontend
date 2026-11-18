import { Link } from 'react-router';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  ClipboardListIcon,
  FileCheck2Icon,
  MessageCircleIcon,
  MessageSquareReplyIcon,
  RefreshCwIcon,
  SparklesIcon,
} from 'lucide-react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { EmptyState, ErrorState, PageHeader, usePageTitle } from '@/components/page';
import { NeededBy, UrgencyBadge } from '@/components/StatusBadge';
import { useStats } from '@/api/queries';
import type { ActivityItem, AdminStats } from '@/api/admin';
import { useAuth } from '@/auth/AuthProvider';
import { registrationStatus, REGISTRATION_FLOW } from '@/content/staff';
import { requestCategoryLabels } from '@/content/options';
import { plural, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export function OverviewPage() {
  usePageTitle('Overview');
  const { staff } = useAuth();
  const { data, error, refetch, isPending, dataUpdatedAt, isFetching } = useStats();
  const firstName = staff?.fullName.split(' ')[0] ?? '';

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="What needs the GIV Office's attention today."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCwIcon aria-hidden className={cn(isFetching && 'animate-spin')} />
            Refresh
          </Button>
        }
      />
      {dataUpdatedAt > 0 && (
        <p className="-mt-4 text-xs text-muted-foreground" aria-live="polite">
          Updated {timeAgo(new Date(dataUpdatedAt).toISOString())}
        </p>
      )}

      {error && !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <OverviewSkeleton />
      ) : (
        <>
          <StatCards stats={data} />
          <div className="grid gap-6 xl:grid-cols-5">
            <AttentionCard stats={data} className="xl:col-span-3" />
            <PipelineCard stats={data} className="xl:col-span-2" />
          </div>
          <div className="grid gap-6 xl:grid-cols-5">
            <UrgencyCard stats={data} className="xl:col-span-2" />
            <RecentCard items={data.recent} className="xl:col-span-3" />
          </div>
        </>
      )}
    </>
  );
}

function StatCards({ stats }: { stats: AdminStats }) {
  const cards = [
    {
      label: 'New registrations',
      value: stats.registrations.submitted,
      icon: SparklesIcon,
      note: stats.registrations.submittedThisWeek
        ? `${plural(stats.registrations.submittedThisWeek, 'registration')} sent this week`
        : 'None sent this week',
      to: '/registrations?status=submitted',
      linkLabel: 'Review new registrations',
    },
    {
      label: 'In review',
      value: stats.registrations.in_review,
      icon: ClipboardListIcon,
      note: `${plural(stats.registrations.contacted, 'student')} contacted, plan not yet active`,
      to: '/registrations?status=in_review',
      linkLabel: 'See registrations in review',
    },
    {
      label: 'Awaiting a reply',
      value: stats.requests.awaitingReply,
      icon: MessageSquareReplyIcon,
      note: `${plural(stats.requests.open + stats.requests.in_progress, 'active request')} in total`,
      to: '/requests?awaiting=true',
      linkLabel: 'Answer support requests',
    },
    {
      label: 'Overdue requests',
      value: stats.requests.overdue,
      icon: AlertTriangleIcon,
      note: stats.requests.dueThisWeek
        ? `${stats.requests.dueThisWeek} more due within 7 days`
        : 'Nothing else due this week',
      to: '/requests?status=active&sort=neededBy&dir=asc',
      linkLabel: 'See requests by due date',
      alert: stats.requests.overdue > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <Card
          key={c.label}
          className={cn(
            'gap-4 bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card',
            c.alert && 'from-red-500/10 ring-1 ring-red-600/30 dark:ring-red-400/30',
          )}
        >
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">{c.label}</CardTitle>
            <p className="text-3xl font-semibold tabular-nums">{c.value.toLocaleString('en-GB')}</p>
            <CardAction>
              <c.icon
                aria-hidden
                className={cn('size-5 text-muted-foreground', c.alert && 'text-red-700 dark:text-red-300')}
              />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <span className="text-muted-foreground">{c.note}</span>
            <Link
              to={c.to}
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              {c.linkLabel} <ArrowRightIcon aria-hidden className="size-4" />
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function AttentionCard({ stats, className }: { stats: AdminStats; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>Overdue, urgent, or due within 7 days. Most pressing first.</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link to="/requests?status=active">All active requests</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {stats.attention.length === 0 ? (
          <EmptyState title="Nothing pressing" description="No active request is overdue, urgent or due this week." />
        ) : (
          <ul className="divide-y rounded-lg border">
            {stats.attention.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/requests/${r.id}`}
                  className="flex flex-col gap-1 p-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {r.studentName} · {requestCategoryLabels[r.category].label} · {r.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {r.awaitingReply && (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageCircleIcon aria-hidden className="size-4" /> Awaiting reply
                      </span>
                    )}
                    <UrgencyBadge urgency={r.urgency} />
                    <NeededBy neededBy={r.neededBy} active />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const pipelineConfig = { count: { label: 'Registrations', color: 'var(--chart-1)' } } satisfies ChartConfig;

function PipelineCard({ stats, className }: { stats: AdminStats; className?: string }) {
  const data = REGISTRATION_FLOW.map((s) => ({
    stage: registrationStatus[s].label,
    status: s,
    count: stats.registrations[s],
  }));
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Registrations by stage</CardTitle>
        <CardDescription>{plural(stats.registrations.total, 'registration')} sent to GIV so far.</CardDescription>
      </CardHeader>
      <CardContent>
        {stats.registrations.total === 0 ? (
          <EmptyState
            title="No registrations yet"
            description="When students send their registration, it appears here."
          />
        ) : (
          <>
            <ChartContainer config={pipelineConfig} className="aspect-auto h-56 w-full" aria-hidden>
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40 }} accessibilityLayer={false}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} width={110} />
                <XAxis type="number" hide allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={6}>
                  <LabelList dataKey="count" position="right" className="fill-foreground" fontSize={12} />
                </Bar>
              </BarChart>
            </ChartContainer>
            {/* The same numbers as text, for screen readers and anyone who prefers a list. */}
            <ul className="sr-only">
              {data.map((d) => (
                <li key={d.status}>
                  {d.stage}: {d.count}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm">
          <Link to="/registrations">
            <FileCheck2Icon aria-hidden /> All registrations
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function UrgencyCard({ stats, className }: { stats: AdminStats; className?: string }) {
  const u = stats.requests.activeByUrgency;
  const total = u.urgent + u.soon + u.normal;
  const rows = [
    {
      key: 'urgent',
      label: 'Urgent',
      hint: 'In the next day or two',
      value: u.urgent,
      bar: 'bg-red-600 dark:bg-red-400',
    },
    { key: 'soon', label: 'Soon', hint: 'Within a week', value: u.soon, bar: 'bg-orange-500' },
    { key: 'normal', label: 'No rush', hint: 'In the next few weeks', value: u.normal, bar: 'bg-primary' },
  ] as const;
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Active requests by urgency</CardTitle>
        <CardDescription>How soon students said they need help.</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState title="No active requests" description="New support requests from students will appear here." />
        ) : (
          <ul className="space-y-4">
            {rows.map((r) => (
              <li key={r.key}>
                <Link to={`/requests?status=active&urgency=${r.key}`} className="group block rounded-md">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                    <span>
                      <span className="font-medium group-hover:underline">{r.label}</span>{' '}
                      <span className="text-muted-foreground">· {r.hint}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{r.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div
                      className={cn('h-full rounded-full', r.bar)}
                      style={{ width: `${(r.value / total) * 100}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const activityText: Record<ActivityItem['kind'], string> = {
  registration_submitted: 'sent a registration',
  registration_updated: 'updated their registration',
  request_created: 'asked for support',
  student_message: 'replied',
};

function RecentCard({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent student activity</CardTitle>
        <CardDescription>The latest registrations, requests and replies.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState title="No activity yet" description="When students register or ask for support, it shows here." />
        ) : (
          <ol className="relative space-y-4 border-l pl-5">
            {items.map((a, i) => {
              const to = a.requestId ? `/requests/${a.requestId}` : `/registrations/${a.studentId}`;
              return (
                <li key={i} className="relative">
                  <span
                    aria-hidden
                    className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-background bg-primary"
                  />
                  <p className="text-sm">
                    <Link to={to} className="font-medium underline-offset-4 hover:underline">
                      {a.studentName}
                    </Link>{' '}
                    {activityText[a.kind]}
                    {a.requestTitle && (
                      <>
                        : <span className="text-muted-foreground">“{a.requestTitle}”</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={a.at}>{timeAgo(a.at)}</time>
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading the overview">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <Skeleton className="h-80 rounded-xl xl:col-span-3" />
        <Skeleton className="h-80 rounded-xl xl:col-span-2" />
      </div>
    </div>
  );
}
