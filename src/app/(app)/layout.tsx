import type { ReactNode } from 'react';

import { AppShell } from '@/components/shared/app-shell';
import { requireSession } from '@/lib/auth/session';
import { getAvatarUrl } from '@/lib/profile/avatar.server';

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await requireSession();
  const avatarUrl = await getAvatarUrl(session.user.id);

  return (
    <AppShell session={session} avatarUrl={avatarUrl}>
      {children}
    </AppShell>
  );
}
