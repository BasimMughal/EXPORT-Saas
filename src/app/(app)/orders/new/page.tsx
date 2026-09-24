import type { Metadata } from 'next';
import Link from 'next/link';

import { createOrderAction } from '@/app/(app)/orders/actions';
import { OrderForm } from '@/components/shared/orders/order-form';
import { Button } from '@/components/ui/button';
import { requireSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/db/mongoose';
import { CustomerModel } from '@/models/customer.model';
import type { Types } from 'mongoose';

type CustomerLite = {
  _id: Types.ObjectId;
  name: string;
  company?: string | null;
};

export const metadata: Metadata = {
  title: 'Create Order',
};

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const raw = await searchParams;
  const requestedCustomerId = Array.isArray(raw.customerId) ? raw.customerId[0] : raw.customerId;
  await connectMongoose();

  const customers = (await CustomerModel.find({ userId: session.user.id })
    .select('name company')
    .sort({ name: 1 })
    .lean()) as unknown as CustomerLite[];

  const customerOptions = customers.map((customer) => ({
    id: customer._id.toString(),
    label: customer.company ? `${customer.name} - ${customer.company}` : customer.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Create Order</h1>
          <p className="text-sm text-muted-foreground">
            Add a new order and keep every field validated on the server.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/orders">Back</Link>
        </Button>
      </div>

      <OrderForm
        action={createOrderAction}
        // Coming from a customer's page ("New order") preselects that customer.
        initialValues={
          customerOptions.some((customer) => customer.id === requestedCustomerId)
            ? { customerId: requestedCustomerId }
            : undefined
        }
        customers={customerOptions}
        description="Pick an existing customer or add a new one — it is saved together with the order."
        submitLabel="Create Order"
        title="Order Details"
      />
    </div>
  );
}
