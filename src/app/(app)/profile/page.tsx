import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { PageHeader } from '@/components/shared/page-header';
import { ProfileForm } from '@/components/shared/profile/profile-form';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { getPreferredCurrency } from '@/lib/currency/preferred';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { formatDateTimeDisplay } from '@/lib/formatters';
import { UserModel } from '@/models/user.model';

export const metadata: Metadata = {
  title: 'Profile',
};

export default async function ProfilePage() {
  const session = await requireSession();
  const db = await tryConnectMongoose();
  const readOnly = isDemoUserId(session.user.id) && !db;
  const preferredCurrency = await getPreferredCurrency(session.user.id);

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
    lastLoginAt = user?.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : new Date().toISOString();
  }

  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Profile' }]} />
      {readOnly ? <DemoModeBanner /> : null}
      <PageHeader
        title="Profile"
        description="Manage your identity and account preferences."
      />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <ProfileForm
          name={session.user.name ?? ''}
          email={session.user.email ?? ''}
          preferredCurrency={preferredCurrency}
          readOnly={readOnly}
        />
        <div className="surface-card space-y-3 p-6">
          <h2 className="font-display text-lg font-semibold">Account activity</h2>
          <p className="text-sm text-muted-foreground">
            Role: <span className="capitalize text-foreground">{session.user.role}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Signed up:{' '}
            <span className="text-foreground">{formatDateTimeDisplay(signedUpAt)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Last login:{' '}
            <span className="text-foreground">{formatDateTimeDisplay(lastLoginAt)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Your data is isolated by user account. Customers, orders, and expenses created under
            this login are never shared with other users.
          </p>
        </div>
      </div>
    </div>
  );
}
