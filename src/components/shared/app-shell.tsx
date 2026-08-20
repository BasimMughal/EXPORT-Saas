'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session } from 'next-auth';
import { Menu, Plus, Ship, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { SignOutButton } from '@/components/shared/auth/sign-out-button';
import { Button } from '@/components/ui/button';
import { sidebarNavigation, type NavItem } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

type AppShellProps = {
  children: ReactNode;
  session: Session;
};

const sectionFor = (item: NavItem) => {
  if (item.href === '/dashboard') return 'Overview';
  if (['/customers', '/orders'].includes(item.href)) return 'Operations';
  if (['/payments', '/expenses', '/expense-categories', '/reports'].includes(item.href)) {
    return 'Finance';
  }
  return 'Workspace';
};

export function AppShell({ children, session }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const role = session.user.role;
  const visibleNav = sidebarNavigation.filter((item) => !item.roles || item.roles.includes(role));
  const activeItem = visibleNav.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const initials = (session.user.name ?? session.user.email ?? 'U')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const nav = (
    <nav className="space-y-6">
      {['Overview', 'Operations', 'Finance', 'Workspace'].map((section) => {
        const items = visibleNav.filter((item) => sectionFor(item) === section);
        if (!items.length) return null;

        return (
          <div key={section}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {section}
            </p>
            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0 transition-colors',
                        isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-200',
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                    {isActive ? (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full w-full flex-col bg-slate-950 text-white">
      <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <Ship className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="font-display truncate text-[17px] font-semibold tracking-tight">
            {siteConfig.name}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live workspace
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">{nav}</div>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{session.user.name ?? 'User'}</p>
            <p className="truncate text-[11px] text-slate-500">{session.user.email}</p>
          </div>
          <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-400">
            {session.user.role}
          </span>
        </div>
        <SignOutButton className="h-9 w-full justify-start rounded-lg px-3 text-slate-400 hover:bg-white/10 hover:text-white" />
      </div>
    </div>
  );

  return (
    <div className="app-canvas min-h-screen text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] border-r border-slate-800 lg:flex">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] shadow-2xl animate-fade-in">
            {sidebar}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              className="absolute right-3 top-4 text-slate-400 hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="min-h-screen lg:pl-[252px]">
        <header className="sticky top-0 z-30 h-16 border-b border-border/80 bg-background/90 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg bg-card lg:hidden"
                onClick={() => setOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {activeItem?.title ?? 'Dashboard'}
                </p>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  {activeItem?.description ?? 'Business overview'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="h-9 rounded-lg shadow-none">
                <Link href="/orders/new">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New order</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-lg bg-card">
                <Link href="/profile" aria-label="Open profile">
                  <span className="text-[11px] font-bold">{initials}</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1480px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
