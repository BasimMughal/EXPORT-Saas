import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DEMO_ACCOUNT, isDemoUserId } from '@/lib/auth/demo';
import { hasPermission } from '@/lib/auth/authorization';
import { requireSession } from '@/lib/auth/session';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { formatDateTimeDisplay } from '@/lib/formatters';
import { UserModel } from '@/models/user.model';

export const metadata: Metadata = {
  title: 'Users',
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  signedUpAt: string;
  lastLoginAt: string | null;
};

export default async function UsersPage() {
  const session = await requireSession();

  if (!hasPermission(session.user.role, 'auth:manage')) {
    redirect('/dashboard');
  }

  const db = await tryConnectMongoose();
  const useDemoFallback = isDemoUserId(session.user.id) && !db;

  let rows: UserRow[] = [];

  if (useDemoFallback) {
    rows = [
      {
        id: DEMO_ACCOUNT.id,
        name: DEMO_ACCOUNT.name,
        email: DEMO_ACCOUNT.email,
        role: DEMO_ACCOUNT.role,
        status: 'active',
        signedUpAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
    ];
  } else if (db) {
    const users = await UserModel.find({})
      .select('name email role status createdAt lastLoginAt')
      .sort({ createdAt: -1 })
      .lean();

    rows = users.map((user) => {
      const doc = user as unknown as {
        _id: { toString(): string };
        name: string;
        email: string;
        role: string;
        status: string;
        createdAt?: Date;
        lastLoginAt?: Date | null;
      };
      return {
        id: String(doc._id),
        name: doc.name,
        email: doc.email,
        role: doc.role,
        status: doc.status,
        signedUpAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : '',
        lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt).toISOString() : null,
      };
    });
  }

  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Users' }]} />
      {useDemoFallback ? <DemoModeBanner /> : null}
      <PageHeader
        title="User registry"
        description="Record of every account that signed up, with signup time and last login."
      />

      <div className="surface-card p-4 text-sm text-muted-foreground">
        Total registered users:{' '}
        <span className="font-medium text-foreground">{rows.length}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Signed up</TableHead>
              <TableHead>Last login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No users found. Sign-ups appear here after MongoDB is connected.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{user.status}</TableCell>
                  <TableCell>{formatDateTimeDisplay(user.signedUpAt)}</TableCell>
                  <TableCell>{formatDateTimeDisplay(user.lastLoginAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
