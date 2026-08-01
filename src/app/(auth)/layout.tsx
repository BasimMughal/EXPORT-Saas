import { Ship } from 'lucide-react';
import type { ReactNode } from 'react';

import { siteConfig } from '@/config/site';

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="auth-mesh relative min-h-screen overflow-hidden text-foreground">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-soft-pulse" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl animate-soft-pulse" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-10">
        <section className="animate-fade-up space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Ship className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-wide text-foreground">{siteConfig.name}</span>
          </div>

          <div className="space-y-5">
            <h1 className="font-display max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-6xl">
              Export operations,
              <span className="block text-primary">clearly in control.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              A bright, focused workspace for garment exporters — customers, orders, payments,
              expenses, and profit in one place.
            </p>
          </div>

          <div className="grid max-w-xl gap-3 sm:grid-cols-3">
            {[
              { label: 'Orders', value: 'Live pipeline' },
              { label: 'Costs', value: 'Profit clarity' },
              { label: 'Reports', value: 'PDF · Excel · CSV' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="animate-fade-up flex items-center justify-center">{children}</section>
      </div>
    </div>
  );
}
