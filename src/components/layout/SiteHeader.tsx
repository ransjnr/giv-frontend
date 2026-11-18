import { Fragment, useEffect, useState } from 'react';
import { Link, useMatches, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ClipboardListIcon, MessagesSquareIcon, SearchIcon } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { api } from '@/api/client';
import { RegistrationStatusBadge, RequestStatusBadge } from '@/components/StatusBadge';
import type { ActiveRegistrationStatus } from '@/content/staff';

/** Each route can describe its breadcrumb with `handle: { crumb }`. */
export type Crumb = { label: string; to?: string };
export type RouteHandle = { crumb?: (params: Record<string, string | undefined>) => Crumb };

export function SiteHeader() {
  const matches = useMatches();
  const crumbs = matches
    .map((m) => (m.handle as RouteHandle | undefined)?.crumb?.(m.params))
    .filter((c): c is Crumb => !!c);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b bg-background/95 backdrop-blur">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList>
            {crumbs.map((c, i) => (
              <Fragment key={i}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem className="min-w-0">
                  {c.to && i < crumbs.length - 1 ? (
                    <BreadcrumbLink asChild>
                      <Link to={c.to}>{c.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <QuickSearch />
        </div>
      </div>
    </header>
  );
}

/** ⌘K / Ctrl+K: find a student or request by name, student ID, request ID or title. */
function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Wait until typing pauses before searching.
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 250);
    return () => clearTimeout(t);
  }, [text]);

  const enabled = open && q.length >= 2;
  const regs = useQuery({
    queryKey: ['search', 'registrations', q],
    queryFn: () => api.registrations({ q, pageSize: 5 }),
    enabled,
  });
  const reqs = useQuery({
    queryKey: ['search', 'requests', q],
    queryFn: () => api.requests({ q, pageSize: 5 }),
    enabled,
  });

  const go = (to: string) => {
    setOpen(false);
    setText('');
    navigate(to);
  };

  const loading = enabled && (regs.isFetching || reqs.isFetching);
  const nothing = enabled && !loading && !regs.data?.items.length && !reqs.data?.items.length;

  return (
    <>
      <Button
        variant="outline"
        className="h-9 w-9 justify-start gap-2 px-0 text-muted-foreground sm:w-72 sm:px-3"
        onClick={() => setOpen(true)}
      >
        <SearchIcon aria-hidden className="mx-auto sm:mx-0" />
        <span className="hidden sm:inline">Search students or requests</span>
        <span className="sr-only sm:hidden">Search students or requests</span>
        <Kbd aria-hidden className="ml-auto hidden lg:inline-flex">
          Ctrl K
        </Kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Find a student by name or student ID, or a request by its ID or title."
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Name, student ID, REQ-0001 or title…"
            value={text}
            onValueChange={setText}
            aria-label="Search students or requests"
          />
          <CommandList>
            {!enabled && <p className="px-4 py-6 text-center text-sm text-muted-foreground">Type at least 2 characters.</p>}
            {loading && <p className="px-4 py-6 text-center text-sm text-muted-foreground">Searching…</p>}
            {nothing && <CommandEmpty>No students or requests match "{q}".</CommandEmpty>}
            {!!regs.data?.items.length && (
              <CommandGroup heading="Registrations">
                {regs.data.items.map((r) => (
                  <CommandItem key={r.studentId} value={`reg-${r.studentId}`} onSelect={() => go(`/registrations/${r.studentId}`)}>
                    <ClipboardListIcon aria-hidden />
                    <span className="truncate">
                      {r.fullName} <span className="text-muted-foreground">· {r.studentId}</span>
                    </span>
                    <span className="ml-auto">
                      <RegistrationStatusBadge status={r.status as ActiveRegistrationStatus} />
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!!reqs.data?.items.length && (
              <CommandGroup heading="Support requests">
                {reqs.data.items.map((r) => (
                  <CommandItem key={r.id} value={`req-${r.id}`} onSelect={() => go(`/requests/${r.id}`)}>
                    <MessagesSquareIcon aria-hidden />
                    <span className="truncate">
                      {r.title} <span className="text-muted-foreground">· {r.id} · {r.studentName}</span>
                    </span>
                    <span className="ml-auto">
                      <RequestStatusBadge status={r.status} />
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
