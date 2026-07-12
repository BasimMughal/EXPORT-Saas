import type { ReactNode } from 'react';

import { AppShell } from '@/components/shared/app-shell';
import { requireSession } from '@/lib/auth/session';

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await requireSession();

  return <AppShell session={session}>{children}</AppShell>;
}
