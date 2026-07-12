import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const session = await requireSession();

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Signed in user</CardDescription>
            <CardTitle className="text-3xl">{session?.user.name ?? 'User'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{session?.user.email}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Role</CardDescription>
            <CardTitle className="text-3xl">{session?.user.role ?? 'viewer'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Authorization foundation is active.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Organization</CardDescription>
            <CardTitle className="text-3xl">
              {session?.user.organizationId ? 'Connected' : 'Not set'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Tenant isolation is enforced by design.</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foundation ready</CardTitle>
          <CardDescription>
            The project scaffold is configured for production, but business modules are intentionally
            not added yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Add export orders, customers, invoices, shipments, and analytics in the next phase.
        </CardContent>
      </Card>
    </div>
  );
}
