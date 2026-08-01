'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session } from 'next-auth';
import { Menu, Ship, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { SignOutButton } from '@/components/shared/auth/sign-out-button';
import { Button } from '@/components/ui/button';
import { sidebarNavigation } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

type AppShellProps = {
  children: ReactNode;
  session: Session;
};

export function AppShell({ children, session }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const role = session.user.role;
  const visibleNav = sidebarNavigation.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
  const activeItem = visibleNav.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  const nav = (
    <nav className="space-y-1">
      {visibleNav.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
              isActive
                ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))] shadow-sm ring-1 ring-primary/10'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
              )}
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{item.title}</span>
              <span className="block truncate text-[11px] text-muted-foreground/80">
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="app-canvas min-h-screen text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[270px_1fr]">
        <aside className="hidden border-r border-sidebar-border bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] shadow-[4px_0_24px_-16px_hsl(222_40%_20%/0.12)] lg:flex">
          <div className="flex h-full w-full flex-col gap-8 p-5">
            <div className="flex items-center gap-3 px-1 pt-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <Ship className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                  {siteConfig.name}
                </p>
                <p className="text-xs font-medium text-primary">Export operations</p>
              </div>
            </div>

            {nav}

            <div className="mt-auto space-y-3">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-secondary/80 to-accent/40 p-4">
                <p className="text-sm font-semibold text-foreground">{session.user.name ?? 'User'}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{session.user.email}</p>
                <p className="mt-3 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  {session.user.role}
                </p>
              </div>
              <SignOutButton className="w-full rounded-xl border-border bg-card text-foreground hover:bg-secondary" />
            </div>
          </div>
        </aside>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-foreground/25 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col gap-6 border-r border-sidebar-border bg-[hsl(var(--sidebar-background))] p-5 text-[hsl(var(--sidebar-foreground))] shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-semibold">{siteConfig.name}</p>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {nav}
            </div>
          </div>
        ) : null}

        <main className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/80 bg-white/75 px-4 py-3 backdrop-blur-xl md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl lg:hidden"
                  onClick={() => setOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Workspace
                  </p>
                  <h2 className="font-display text-lg font-semibold tracking-tight md:text-xl">
                    {activeItem?.title ?? 'Dashboard'}
                  </h2>
                </div>
              </div>
              <div className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground shadow-sm">
                Signed in as <span className="font-semibold text-foreground">{session.user.email}</span>
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
