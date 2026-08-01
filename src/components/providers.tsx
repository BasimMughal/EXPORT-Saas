'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import type { Session } from 'next-auth';
import type { ReactNode } from 'react';

type ProvidersProps = {
  children: ReactNode;
  session: Session | null;
};

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
        {children}
        <Toaster
          theme="light"
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: 'border border-border bg-card text-card-foreground shadow-lg',
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
