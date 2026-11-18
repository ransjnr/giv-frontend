import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeftIcon, CheckCircle2Icon, ClipboardListIcon, PlayIcon, RotateCcwIcon, SendIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ErrorState, PageHeader, usePageTitle } from '@/components/page';
import { NeededBy, RequestStatusBadge, UrgencyBadge } from '@/components/StatusBadge';
import { useReply, useRequest, useSetRequestStatus } from '@/api/queries';
import type { SupportRequest } from '@/api/schema';
import { requestCategoryLabels } from '@/content/options';
import { requestStatus } from '@/content/staff';
import { formatDate, formatDateTime, initials } from '@/lib/format';
import { cn } from '@/lib/utils';

export function RequestDetailPage() {
  const { id = '' } = useParams();
  const { data, error, refetch, isPending } = useRequest(id);
  usePageTitle(data ? `${data.request.title} · ${data.request.id}` : 'Support request');

  if (error && !data) {
    return (
      <>
        <BackLink />
        <ErrorState error={error} onRetry={() => refetch()} />
      </>
    );
  }
  if (isPending) return <DetailSkeleton />;

  const { request: req, student } = data;
  const active = req.status === 'open' || req.status === 'in_progress';

  return (
    <>
      <PageHeader
        eyebrow={<BackLink />}
        title={req.title}
        description={
          <>
            <span className="tabular-nums">{req.id}</span> · {requestCategoryLabels[req.category].label} · from{' '}
            <Link to={`/registrations/${student.studentId}`} className="font-medium text-foreground underline-offset-4 hover:underline">
              {student.fullName}
            </Link>
          </>
        }
        actions={<StatusActions req={req} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="thread-h" className="space-y-4 lg:col-span-2">
          <h2 id="thread-h" className="sr-only">
            Conversation
          </h2>
          <ol className="space-y-4">
            <Message from="student" author={student.fullName} at={req.createdAt} body={req.details} first />
            {req.messages.map((m) => (
              <Message key={m.id} from={m.from} author={m.from === 'giv' ? (m.author ?? 'GIV Office') : student.fullName} at={m.at} body={m.body} />
            ))}
          </ol>

          {req.status === 'withdrawn' ? (
            <Alert>
              <AlertTitle>The student withdrew this request</AlertTitle>
              <AlertDescription>It can't be replied to. They can send a new request if they still need help.</AlertDescription>
            </Alert>
          ) : (
            <ReplyBox req={req} studentFirstName={student.fullName.split(' ')[0] ?? ''} />
          )}
        </section>

        <aside className="space-y-6" aria-label="Request details">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <RequestStatusBadge status={req.status} />
                </dd>
                <dt className="text-muted-foreground">Urgency</dt>
                <dd>
                  <UrgencyBadge urgency={req.urgency} />
                </dd>
                <dt className="text-muted-foreground">Needed by</dt>
                <dd>
                  <NeededBy neededBy={req.neededBy} active={active} />
                </dd>
                <dt className="text-muted-foreground">Category</dt>
                <dd>{requestCategoryLabels[req.category].label}</dd>
                <dt className="text-muted-foreground">Sent</dt>
                <dd>{formatDate(req.createdAt)}</dd>
                <dt className="text-muted-foreground">Last activity</dt>
                <dd>{formatDateTime(req.updatedAt)}</dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student</CardTitle>
              <CardDescription>
                {student.programme} · Level {student.level}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="font-medium">{student.fullName}</span>
                <span className="block text-muted-foreground tabular-nums">{student.studentId}</span>
              </p>
              <a href={`mailto:${student.universityEmail}`} className="block truncate text-primary underline-offset-4 hover:underline">
                {student.universityEmail}
              </a>
              <Button asChild variant="outline" className="w-full">
                <Link to={`/registrations/${student.studentId}`}>
                  <ClipboardListIcon aria-hidden /> Open their registration
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">Check their consent there before contacting their department.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function BackLink() {
  return (
    <Link to="/requests" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon aria-hidden className="size-4" /> Support requests
    </Link>
  );
}

function StatusActions({ req }: { req: SupportRequest }) {
  const mutation = useSetRequestStatus(req.id);
  const setStatus = (status: 'open' | 'in_progress' | 'resolved') =>
    mutation.mutate(status, {
      onSuccess: () => toast.success(`${req.id} is now “${requestStatus[status].label}”`),
      onError: (e) => toast.error(e.message),
    });
  if (req.status === 'withdrawn') return <RequestStatusBadge status="withdrawn" />;
  return (
    <>
      {req.status === 'open' && (
        <Button variant="outline" onClick={() => setStatus('in_progress')} disabled={mutation.isPending}>
          <PlayIcon aria-hidden /> Mark in progress
        </Button>
      )}
      {req.status !== 'resolved' ? (
        <Button onClick={() => setStatus('resolved')} disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner aria-hidden /> : <CheckCircle2Icon aria-hidden />} Mark resolved
        </Button>
      ) : (
        <Button variant="outline" onClick={() => setStatus('in_progress')} disabled={mutation.isPending}>
          <RotateCcwIcon aria-hidden /> Reopen
        </Button>
      )}
    </>
  );
}

function Message({
  from,
  author,
  at,
  body,
  first,
}: {
  from: 'student' | 'giv';
  author: string;
  at: string;
  body: string;
  first?: boolean;
}) {
  const giv = from === 'giv';
  return (
    <li className={cn('flex gap-3', giv && 'flex-row-reverse')}>
      <span
        aria-hidden
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          giv ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        )}
      >
        {initials(author)}
      </span>
      <article
        aria-label={`${first ? 'Request' : 'Message'} from ${author}`}
        className={cn('max-w-[85%] rounded-2xl border p-4', giv ? 'rounded-tr-sm border-primary/20 bg-primary/5' : 'rounded-tl-sm bg-card')}
      >
        <header className="mb-1.5 flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium">{author}</span>
          <time dateTime={at} className="text-xs text-muted-foreground">
            {formatDateTime(at)}
          </time>
          {first && <span className="text-xs text-muted-foreground">· original request</span>}
        </header>
        <p className="whitespace-pre-line">{body}</p>
      </article>
    </li>
  );
}

function ReplyBox({ req, studentFirstName }: { req: SupportRequest; studentFirstName: string }) {
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [markInProgress, setMarkInProgress] = useState(req.status === 'open');
  const reply = useReply(req.id);
  const status = useSetRequestStatus(req.id);
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setMarkInProgress(req.status === 'open'), [req.status]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!body.trim()) {
      setError('Write a reply before sending.');
      ref.current?.focus();
      return;
    }
    setError('');
    try {
      await reply.mutateAsync(body.trim());
      if (markInProgress && req.status === 'open') await status.mutateAsync('in_progress');
      setBody('');
      toast.success(`Reply sent to ${studentFirstName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Your reply was not sent. Please try again.');
    }
  };

  const pending = reply.isPending || status.isPending;
  return (
    <Card>
      <CardContent>
        <form onSubmit={send} className="space-y-3">
          <Label htmlFor={id}>Reply to {studentFirstName}</Label>
          <Textarea
            ref={ref}
            id={id}
            rows={4}
            maxLength={3000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void send();
            }}
            aria-invalid={!!error}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
            placeholder="Write in plain, friendly language. The student sees your name with the reply."
          />
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {req.status === 'resolved'
              ? 'This request is resolved. Replying keeps it resolved unless you reopen it.'
              : 'Ctrl + Enter sends.'}
          </p>
          {error && (
            <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {req.status === 'open' ? (
              <div className="flex items-center gap-2">
                <Checkbox id={`${id}-progress`} checked={markInProgress} onCheckedChange={(c) => setMarkInProgress(c === true)} />
                <Label htmlFor={`${id}-progress`} className="font-normal">
                  Also mark as in progress
                </Label>
              </div>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner aria-hidden /> : <SendIcon aria-hidden />} Send reply
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading the request">
      <Skeleton className="h-16 w-2/3" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
