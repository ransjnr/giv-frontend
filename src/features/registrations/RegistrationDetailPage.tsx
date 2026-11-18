import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  FileTextIcon,
  MailIcon,
  MessageCircleIcon,
  MessagesSquareIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  XIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, PageHeader, usePageTitle } from '@/components/page';
import { RegistrationStatusBadge } from '@/components/StatusBadge';
import { useRegistration } from '@/api/queries';
import type { RegistrationData } from '@/api/schema';
import {
  academicLabels,
  conditionLabels,
  contactMethodLabels,
  deviceLabels,
  difficultyLabels,
  documentationLabels,
  durationLabels,
  examLabels,
  functionLabels,
  labelOf,
  livingLabels,
  otherSupportLabels,
  relationshipLabels,
  residenceLabels,
} from '@/content/options';
import { nextRegistrationStatus, registrationStatus, type ActiveRegistrationStatus } from '@/content/staff';
import { formatDate, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { StatusDialog } from './StatusDialog';

export function RegistrationDetailPage() {
  const { studentId = '' } = useParams();
  const { data, error, refetch, isPending } = useRegistration(studentId);
  const [dialog, setDialog] = useState<ActiveRegistrationStatus | null>(null);
  usePageTitle(data ? `${data.student.fullName} · Registration` : 'Registration');

  if (error && !data) {
    return (
      <>
        <BackLink />
        <ErrorState error={error} onRetry={() => refetch()} />
      </>
    );
  }
  if (isPending) return <DetailSkeleton />;

  const { student, registration } = data;
  const reg = registration.data;
  const status = registration.status as ActiveRegistrationStatus;
  const next = nextRegistrationStatus(status);

  return (
    <>
      <PageHeader
        eyebrow={<BackLink />}
        title={student.fullName}
        description={
          <>
            <span className="tabular-nums">{student.studentId}</span> · {student.programme} · Level {student.level}
          </>
        }
        actions={
          <>
            <RegistrationStatusBadge status={status} />
            <Button variant="outline" onClick={() => setDialog(status)}>
              Change status
            </Button>
            {next && (
              <Button onClick={() => setDialog(next)}>
                Move to {registrationStatus[next].label} <ArrowRightIcon aria-hidden />
              </Button>
            )}
          </>
        }
      />

      {!reg ? (
        <ErrorState error={new Error('This registration has no submitted details.')} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ConsentCard consent={reg.consent} />
            <DisabilityCard d={reg.disability} />
            <SupportCard s={reg.support} />
          </div>
          <div className="space-y-6">
            <TimelineCard history={registration.history} submittedAt={registration.submittedAt} confirmedAt={registration.confirmedAt} />
            <ContactCard c={reg.contact} email={student.universityEmail} />
            <EmergencyCard e={reg.emergency} />
            <Card>
              <CardHeader>
                <CardTitle>Student record</CardTitle>
                <CardDescription>From the university.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <Item label="Student ID" value={student.studentId} />
                  <Item label="Index number" value={student.indexNumber} />
                  <Item label="College" value={student.college} />
                  <Item label="Programme" value={student.programme} />
                  <Item label="Level" value={student.level} />
                  <Item label="Campus" value={student.campus} />
                </dl>
              </CardContent>
            </Card>
            <Button asChild variant="outline" className="w-full">
              <Link to={`/requests?q=${student.studentId}`}>
                <MessagesSquareIcon aria-hidden /> Support requests from {student.fullName.split(' ')[0]}
              </Link>
            </Button>
          </div>
        </div>
      )}

      {dialog && (
        <StatusDialog
          open={!!dialog}
          onOpenChange={(o) => !o && setDialog(null)}
          studentId={student.studentId}
          studentName={student.fullName}
          current={status}
          initial={dialog}
        />
      )}
    </>
  );
}

function BackLink() {
  return (
    <Link to="/registrations" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon aria-hidden className="size-4" /> Registrations
    </Link>
  );
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value || <span className="text-muted-foreground">Not given</span>}</dd>
    </>
  );
}

function YesNo({ yes }: { yes: boolean }) {
  return yes ? (
    <span className="inline-flex items-center gap-1 font-medium text-emerald-800 dark:text-emerald-300">
      <CheckIcon aria-hidden className="size-4" /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 font-medium text-red-800 dark:text-red-300">
      <XIcon aria-hidden className="size-4" /> No
    </span>
  );
}

/** Consent comes first: it decides who else may see any of this. */
function ConsentCard({ consent }: { consent: RegistrationData['consent'] }) {
  const sharesAny = consent.shareWithFaculty || consent.shareWithHall;
  return (
    <Card className={cn('border-l-4', sharesAny ? 'border-l-primary' : 'border-l-orange-500')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {sharesAny ? (
            <ShieldCheckIcon aria-hidden className="size-5 text-primary" />
          ) : (
            <ShieldAlertIcon aria-hidden className="size-5 text-orange-600 dark:text-orange-400" />
          )}
          Consent
        </CardTitle>
        <CardDescription>
          {sharesAny
            ? 'Only share details with the people the student agreed to below.'
            : 'This student has not agreed to share details beyond the GIV Office. Ask them before contacting anyone.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {[
            ['GIV Office may see these details', consent.shareWithGiv],
            ['Share needs with their department and lecturers', consent.shareWithFaculty],
            ['Share needs with their hall or hostel', consent.shareWithHall],
            ['Contact them about events and opportunities', consent.contactForEvents],
          ].map(([label, yes]) => (
            <div key={label as string} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <dt>{label as string}</dt>
              <dd className="shrink-0">
                <YesNo yes={yes as boolean} />
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function Chips({ items, empty = 'None' }: { items: string[]; empty?: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((i) => (
        <li key={i}>
          <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1 text-sm font-normal whitespace-normal">
            {i}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

const LEVEL_STYLE = {
  some: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200',
  a_lot: 'bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-200',
  cannot: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
} as const;

function DisabilityCard({ d }: { d: RegistrationData['disability'] }) {
  const functions = Object.entries(d.functions) as [keyof typeof functionLabels, keyof typeof LEVEL_STYLE][];
  const conditions = d.conditions.map((c) =>
    c === 'other' && d.otherCondition ? `Other: ${d.otherCondition}` : labelOf(conditionLabels, c),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Difficulties and conditions</CardTitle>
        <CardDescription>What the student told us. Questions follow the Washington Group short set.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section aria-labelledby="dif-h">
          <h3 id="dif-h" className="mb-2 text-sm font-medium">
            Day-to-day difficulties
          </h3>
          {functions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No difficulties selected.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {functions.map(([area, level]) => (
                <li key={area} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                  <span>{functionLabels[area].label}</span>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', LEVEL_STYLE[level])}>
                    {difficultyLabels[level].label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="cond-h">
          <h3 id="cond-h" className="mb-2 text-sm font-medium">
            Conditions
          </h3>
          <Chips items={conditions} empty="No condition named." />
        </section>

        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          <Item label="How long" value={`${labelOf(durationLabels, d.duration)}`} />
          <Item
            label="Medical report"
            value={
              <span className="inline-flex flex-wrap items-center gap-2">
                {labelOf(documentationLabels, d.documentation)}
                {d.documentName && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <FileTextIcon aria-hidden className="size-4" /> {d.documentName} (name only, file not uploaded)
                  </span>
                )}
              </span>
            }
          />
        </dl>

        {d.description && (
          <figure className="rounded-lg border-l-4 border-primary/40 bg-muted/40 p-4">
            <figcaption className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              In the student's words
            </figcaption>
            <blockquote className="whitespace-pre-line">{d.description}</blockquote>
          </figure>
        )}
      </CardContent>
    </Card>
  );
}

function SupportCard({ s }: { s: RegistrationData['support'] }) {
  const groups: [string, string[]][] = [
    ['Exams', s.exams.map((c) => labelOf(examLabels, c))],
    ['Lectures and studying', s.academic.map((c) => labelOf(academicLabels, c))],
    ['Accommodation and getting around', s.living.map((c) => labelOf(livingLabels, c))],
    ['Devices they use', s.devicesUsed.map((c) => labelOf(deviceLabels, c))],
    ['Devices they need', s.devicesNeeded.map((c) => labelOf(deviceLabels, c))],
    ['Other support', s.other.map((c) => labelOf(otherSupportLabels, c))],
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Support needed</CardTitle>
        <CardDescription>What the student asked GIV to arrange.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.map(([title, items]) => (
          <section key={title} aria-label={title}>
            <h3 className="mb-2 text-sm font-medium">{title}</h3>
            <Chips items={items} />
          </section>
        ))}
        {s.notes && (
          <figure className="rounded-lg border-l-4 border-primary/40 bg-muted/40 p-4">
            <figcaption className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Anything else, in their words
            </figcaption>
            <blockquote className="whitespace-pre-line">{s.notes}</blockquote>
          </figure>
        )}
      </CardContent>
    </Card>
  );
}

function ContactCard({ c, email }: { c: RegistrationData['contact']; email: string }) {
  const whatsapp = c.whatsappSameAsPhone ? c.phone : c.whatsapp;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact</CardTitle>
        <CardDescription>Prefers: {c.contactMethods.map((m) => labelOf(contactMethodLabels, m)).join(', ')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {c.preferredName && (
          <p>
            <span className="text-muted-foreground">Likes to be called </span>
            <span className="font-medium">{c.preferredName}</span>
          </p>
        )}
        <ContactLine icon={PhoneIcon} href={`tel:${c.phone.replace(/\s/g, '')}`} label="Phone" value={c.phone} />
        {whatsapp && (
          <ContactLine
            icon={MessageCircleIcon}
            href={`https://wa.me/${whatsapp.replace(/\D/g, '').replace(/^0/, '233')}`}
            label="WhatsApp"
            value={whatsapp}
            external
          />
        )}
        <ContactLine icon={MailIcon} href={`mailto:${email}`} label="University email" value={email} />
        {c.personalEmail && <ContactLine icon={MailIcon} href={`mailto:${c.personalEmail}`} label="Personal email" value={c.personalEmail} />}
        <p>
          <span className="text-muted-foreground">Lives in </span>
          {labelOf(residenceLabels, c.residenceType)}
          {c.residenceName && `: ${c.residenceName}`}
        </p>
      </CardContent>
    </Card>
  );
}

function ContactLine({
  icon: Icon,
  href,
  label,
  value,
  external,
}: {
  icon: typeof PhoneIcon;
  href: string;
  label: string;
  value: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/60"
    >
      <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate font-medium">{value}</span>
      </span>
      {external && <span className="sr-only">(opens in a new tab)</span>}
    </a>
  );
}

function EmergencyCard({ e }: { e: RegistrationData['emergency'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency contact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>
          <span className="font-medium">{e.name}</span>{' '}
          <span className="text-muted-foreground">({labelOf(relationshipLabels, e.relationship)})</span>
        </p>
        <ContactLine icon={PhoneIcon} href={`tel:${e.phone.replace(/\s/g, '')}`} label="Phone" value={e.phone} />
        <p className="text-muted-foreground">
          {e.hasPersonalAssistant
            ? `Has a personal assistant${e.assistantName ? `: ${e.assistantName}` : ''}.`
            : 'No personal assistant.'}
        </p>
      </CardContent>
    </Card>
  );
}

function TimelineCard({
  history,
  submittedAt,
  confirmedAt,
}: {
  history: { status: string; at: string; note?: string }[];
  submittedAt?: string;
  confirmedAt?: string;
}) {
  const events = [...history].reverse();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <CardDescription>
          {submittedAt && <>Sent {formatDate(submittedAt)}. </>}
          {confirmedAt ? <>Needs last confirmed {formatDate(confirmedAt)}.</> : 'Not yet confirmed this semester.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-4 border-l pl-5">
          {events.map((e, i) => {
            const label =
              e.status in registrationStatus ? registrationStatus[e.status as ActiveRegistrationStatus].label : e.status;
            return (
              <li key={i} className="relative">
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-background',
                    i === 0 ? 'bg-primary' : 'bg-muted-foreground/50',
                  )}
                />
                <p className="text-sm font-medium">
                  {e.note === 'You updated your details.' ? 'Student updated their details' : label}
                </p>
                <p className="text-xs text-muted-foreground">
                  <time dateTime={e.at}>{formatDateTime(e.at)}</time>
                </p>
                {e.note && e.note !== 'You updated your details.' && (
                  <p className="mt-1.5 rounded-md bg-muted/60 p-2 text-sm">
                    <span className="sr-only">Note shown to the student: </span>
                    {e.note}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading the registration">
      <Skeleton className="h-16 w-2/3" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
