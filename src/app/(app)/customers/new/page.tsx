import type { Metadata } from 'next';
import Link from 'next/link';

import { createCustomerAction } from '@/app/(app)/customers/actions';
import { CustomerForm } from '@/components/shared/customers/customer-form';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Create Customer',
};

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Create Customer</h1>
          <p className="text-sm text-muted-foreground">Add a new customer record to your account.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/customers">Back</Link>
        </Button>
      </div>

      <CustomerForm
        action={createCustomerAction}
        description="Enter the customer details below. All data is validated on the server."
        submitLabel="Create Customer"
        title="Customer Details"
      />
    </div>
  );
}
