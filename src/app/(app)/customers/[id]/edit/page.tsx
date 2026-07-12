import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { updateCustomerAction } from '@/app/(app)/customers/actions';
import { CustomerForm } from '@/components/shared/customers/customer-form';
import { Button } from '@/components/ui/button';
import { requireSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/db/mongoose';
import { CustomerModel } from '@/models/customer.model';

type CustomerEditItem = {
  _id: Types.ObjectId;
  name: string;
  company?: string | null;
  country: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
};

export const metadata: Metadata = {
  title: 'Edit Customer',
};

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await Promise.resolve(params);

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectMongoose();
  const customer = (await CustomerModel.findOne({
    _id: new Types.ObjectId(id),
    userId: new Types.ObjectId(session.user.id),
  }).lean()) as CustomerEditItem | null;

  if (!customer) {
    notFound();
  }

  const action = updateCustomerAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Edit Customer</h1>
          <p className="text-sm text-muted-foreground">Update a customer you own. Cross-user access is blocked.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/customers">Back</Link>
        </Button>
      </div>

      <CustomerForm
        action={action}
        description="All updates are validated and authorized on the server."
        initialValues={{
          name: customer.name,
          company: customer.company ?? '',
          country: customer.country,
          phone: customer.phone ?? '',
          email: customer.email ?? '',
          notes: customer.notes ?? '',
        }}
        submitLabel="Save Changes"
        title="Customer Details"
      />
    </div>
  );
}
