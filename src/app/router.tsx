import { createBrowserRouter, Link, Outlet, useRouteError } from 'react-router';
import { AlertCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader, usePageTitle } from '@/components/page';
import type { RouteHandle } from '@/components/layout/SiteHeader';
import { RequireAuth } from '@/auth/AuthProvider';

const handle = (crumb: RouteHandle['crumb']): RouteHandle => ({ crumb });

export const router = createBrowserRouter([
  {
    element: <Outlet />,
    errorElement: <RouteError />,
    children: [
      { path: '/login', lazy: async () => ({ Component: (await import('@/features/auth/LoginPage')).LoginPage }) },
      {
        path: '/',
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        handle: handle(() => ({ label: 'GIV Admin', to: '/' })),
        children: [
          {
            index: true,
            handle: handle(() => ({ label: 'Overview' })),
            lazy: async () => ({ Component: (await import('@/features/overview/OverviewPage')).OverviewPage }),
          },
          {
            path: 'registrations',
            handle: handle(() => ({ label: 'Registrations', to: '/registrations' })),
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('@/features/registrations/RegistrationsPage')).RegistrationsPage,
                }),
              },
              {
                path: ':studentId',
                handle: handle((p) => ({ label: p.studentId ?? 'Student' })),
                lazy: async () => ({
                  Component: (await import('@/features/registrations/RegistrationDetailPage')).RegistrationDetailPage,
                }),
              },
            ],
          },
          {
            path: 'requests',
            handle: handle(() => ({ label: 'Support requests', to: '/requests' })),
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import('@/features/requests/RequestsPage')).RequestsPage }),
              },
              {
                path: ':id',
                handle: handle((p) => ({ label: p.id ?? 'Request' })),
                lazy: async () => ({
                  Component: (await import('@/features/requests/RequestDetailPage')).RequestDetailPage,
                }),
              },
            ],
          },
          { path: '*', handle: handle(() => ({ label: 'Not found' })), element: <NotFound /> },
        ],
      },
    ],
  },
]);

function NotFound() {
  usePageTitle('Page not found');
  return (
    <>
      <PageHeader title="We can't find that page" description="The link may be wrong, or the page may have moved." />
      <div>
        <Button asChild>
          <Link to="/">Go to the overview</Link>
        </Button>
      </div>
    </>
  );
}

/** Shown if a page fails to load, e.g. after a new version is deployed or when offline. */
function RouteError() {
  const error = useRouteError() as Error | undefined;
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 p-6">
      <AlertCircleIcon aria-hidden className="size-8 text-destructive" />
      <h1 className="text-2xl font-semibold">{offline ? "You're offline" : 'This page could not load'}</h1>
      <p className="text-muted-foreground">
        {offline
          ? 'Check your internet connection, then try again.'
          : 'Reloading usually fixes this. If it keeps happening, tell the RAIL team what you were doing.'}
      </p>
      {import.meta.env.DEV && error?.message && <pre className="overflow-auto rounded bg-muted p-3 text-xs">{error.message}</pre>}
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Button asChild variant="outline">
          <a href="/">Go to the overview</a>
        </Button>
      </div>
    </main>
  );
}
