import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CalendarPlus, LogIn, ShieldCheck } from 'lucide-react';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { PageHeader } from '@/components/shared/page-header';
import { AvatarUploader } from '@/components/shared/profile/avatar-uploader';
import { ProfileForm } from '@/components/shared/profile/profile-form';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { getPreferredCurrency } from '@/lib/currency/preferred';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { formatDateDisplay } from '@/lib/formatters';
import { getAvatarUrl } from '@/lib/profile/avatar.server';
import { UserModel } from '@/models/user.model';

export const metadata: Metadata = {
  title: 'Profile',
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </h2>
  );
}

/** A date with its time shown quietly beside it, e.g. "Sep 25, 2026 · 12:42 AM". */
function ActivityRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
}) {
  const time = value
    ? new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
    : null;

  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="flex items-center gap-2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
        {icon}
        {label}
      </dt>
      <dd className="text-right">
        <span className="font-medium">{formatDateDisplay(value)}</span>
        {time ? <span className="ml-1.5 text-muted-foreground">· {time}</span> : null}
      </dd>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await requireSession();
  const db = await tryConnectMongoose();
  const readOnly = isDemoUserId(session.user.id) && !db;
  const [preferredCurrency, avatarUrl] = await Promise.all([
    getPreferredCurrency(session.user.id),
    getAvatarUrl(session.user.id),
  ]);

  let signedUpAt: string | null = null;
  let lastLoginAt: string | null = null;

  if (isDemoUserId(session.user.id) && !db) {
    signedUpAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString();
    lastLoginAt = new Date().toISOString();
  } else if (db && !isDemoUserId(session.user.id)) {
    const user = (await UserModel.findById(session.user.id)
      .select('createdAt lastLoginAt')
      .lean()) as { createdAt?: Date; lastLoginAt?: Date | null } | null;
    signedUpAt = user?.createdAt ? new Date(user.createdAt).toISOString() : null;
    lastLoginAt = user?.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null;
  } else if (db && isDemoUserId(session.user.id)) {
    const user = (await UserModel.findOne({ email: session.user.email })
      .select('createdAt lastLoginAt')
      .lean()) as { createdAt?: Date; lastLoginAt?: Date | null } | null;
    signedUpAt = user?.createdAt
      ? new Date(user.createdAt).toISOString()
      : new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString();
    lastLoginAt = user?.lastLoginAt
      ? new Date(user.lastLoginAt).toISOString()
      : new Date().toISOString();
  }

  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Profile' }]} />
      {readOnly ? <DemoModeBanner /> : null}
      <PageHeader title="Profile" description="Manage your identity and account preferences." />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <ProfileForm
          name={session.user.name ?? ''}
          email={session.user.email ?? ''}
          preferredCurrency={preferredCurrency}
          readOnly={readOnly}
        />
        <aside className="surface-card flex flex-col divide-y divide-border/70 overflow-hidden">
          <section className="p-6">
            <SectionLabel>Profile photo</SectionLabel>
            <div className="mt-4">
              <AvatarUploader
                name={session.user.name ?? session.user.email ?? 'User'}
                email={session.user.email ?? ''}
                avatarUrl={avatarUrl}
              />
            </div>
          </section>

          <section className="flex-1 p-6">
            <SectionLabel>Account activity</SectionLabel>
            <dl className="mt-3 divide-y divide-border/60 text-sm">
              <ActivityRow icon={<CalendarPlus />} label="Member since" value={signedUpAt} />
              <ActivityRow icon={<LogIn />} label="Last login" value={lastLoginAt} />
            </dl>
          </section>

          <div className="flex gap-3 bg-emerald-50/60 px-6 py-4 text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Private workspace.</span> Your
              customers, orders and expenses are visible only to you.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
