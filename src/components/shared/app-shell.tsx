import Link from 'next/link';
import type { Session } from 'next-auth';
import type { ReactNode } from 'react';

import { SignOutButton } from '@/components/shared/auth/sign-out-button';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { sidebarNavigation } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

type AppShellProps = {
  children: ReactNode;
  session: Session;
};

export function AppShell({ children, session }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-border/70 bg-card/50 p-6 backdrop-blur">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                {siteConfig.name}
              </p>
              <h1 className="mt-2 text-2xl font-semibold">{session.user.name ?? 'Workspace'}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{session.user.email}</p>
            </div>

            <Separator />

            <nav className="space-y-1">
              {sidebarNavigation.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  className={cn('w-full justify-start')}
                  variant="ghost"
                >
                  <Link href={item.href}>{item.title}</Link>
                </Button>
              ))}
            </nav>

            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm font-medium">Session</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {session.user.role} {session.user.organizationId ? 'with org access' : 'without org'}
              </p>
            </div>

            <SignOutButton className="w-full" />
          </div>
        </aside>

        <main className="flex min-w-0 flex-col">
          <header className="border-b border-border/70 bg-background/80 px-6 py-4 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Protected workspace</p>
                <h2 className="text-xl font-semibold">Dashboard foundation</h2>
              </div>
              <Card className="hidden border-border/70 bg-card/70 shadow-none md:block">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">Signed in</CardTitle>
                  <CardDescription>{session.user.email}</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </header>

          <div className="flex-1 p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
