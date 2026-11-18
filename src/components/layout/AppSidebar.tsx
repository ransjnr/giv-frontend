import { NavLink, useLocation } from 'react-router';
import {
  ChevronsUpDownIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessagesSquareIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useStats } from '@/api/queries';
import { useAuth } from '@/auth/AuthProvider';
import { initials } from '@/lib/format';
import { useTheme, type ThemeChoice } from '@/lib/theme';

export function AppSidebar() {
  const { pathname } = useLocation();
  const stats = useStats().data;
  const nav = [
    { to: '/', label: 'Overview', icon: LayoutDashboardIcon, end: true },
    {
      to: '/registrations',
      label: 'Registrations',
      icon: ClipboardListIcon,
      count: stats?.registrations.submitted,
      countLabel: 'new',
    },
    {
      to: '/requests',
      label: 'Support requests',
      icon: MessagesSquareIcon,
      count: stats?.requests.awaitingReply,
      countLabel: 'awaiting reply',
    },
  ];

  return (
    <Sidebar collapsible="icon" variant="inset">
      <nav aria-label="Main" className="flex h-full min-h-0 flex-col">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild tooltip="Ability Connect GIV Admin">
                <NavLink to="/">
                  <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand-deep">
                    <img src="/favicon.svg" alt="" className="size-5" />
                  </span>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-semibold">Ability Connect</span>
                    <span className="truncate text-xs text-muted-foreground">GIV Office · Admin</span>
                  </span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Work</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => {
                  const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        <NavLink to={item.to} end={item.end} aria-current={active ? 'page' : undefined}>
                          <item.icon aria-hidden />
                          <span>{item.label}</span>
                          {!!item.count && (
                            <span className="sr-only">
                              , {item.count} {item.countLabel}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                      {!!item.count && (
                        <SidebarMenuBadge aria-hidden className="rounded-full bg-primary/10 text-primary">
                          {item.count}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </nav>
      <SidebarRail />
    </Sidebar>
  );
}

function NavUser() {
  const { staff, logout } = useAuth();
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  if (!staff) return null;
  const roleLabel = staff.role === 'admin' ? 'GIV admin' : 'GIV officer';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 font-medium text-primary">
                  {initials(staff.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{staff.fullName}</span>
                <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
              </span>
              <ChevronsUpDownIcon aria-hidden className="ml-auto size-4" />
              <span className="sr-only">Account and settings</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="grid text-sm leading-tight">
                <span className="truncate font-medium">{staff.fullName}</span>
                <span className="truncate text-xs text-muted-foreground">{staff.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Colour theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as ThemeChoice)}>
              <DropdownMenuRadioItem value="system">
                <MonitorIcon aria-hidden /> Match device
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="light">
                <SunIcon aria-hidden /> Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <MoonIcon aria-hidden /> Dark
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logout()}>
              <LogOutIcon aria-hidden /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
