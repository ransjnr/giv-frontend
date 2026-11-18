import { Outlet } from 'react-router';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useFocusOnNavigate } from '@/components/page';
import { AppSidebar } from './AppSidebar';
import { SiteHeader } from './SiteHeader';

export function SkipLink() {
  return (
    <a
      href="#main"
      onClick={(e) => {
        e.preventDefault();
        (document.querySelector<HTMLElement>('main h1') ?? document.getElementById('main'))?.focus();
      }}
      className="sr-only z-50 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      Skip to main content
    </a>
  );
}

/** Signed-in layout: sidebar, header and the current page. */
export function AppLayout() {
  useFocusOnNavigate();
  return (
    <SidebarProvider>
      <SkipLink />
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex flex-1 flex-col gap-6 p-4 outline-none md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
