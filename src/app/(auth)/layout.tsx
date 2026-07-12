import { siteConfig } from '@/config/site';
import type { ReactNode } from 'react';

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage:
          'radial-gradient(circle at top, rgba(2,132,199,0.14), transparent 40%), linear-gradient(180deg, hsl(var(--background)), hsl(var(--muted) / 0.4))',
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-12">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center space-y-6 rounded-3xl border border-border/70 bg-card/80 p-8 shadow-2xl backdrop-blur">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
                {siteConfig.name}
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight md:text-6xl">
                Export operations foundation built for scale.
              </h1>
              <p className="max-w-2xl text-muted-foreground md:text-lg">
                Secure authentication, tenant-aware routing, strict TypeScript, and a shadcn-ready
                design system are already in place.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">{children}</div>
        </div>
      </div>
    </div>
  );
}
