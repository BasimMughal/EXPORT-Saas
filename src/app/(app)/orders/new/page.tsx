import type { Metadata } from 'next';
import Link from 'next/link';

import { createOrderAction } from '@/app/(app)/orders/actions';
import { OrderForm } from '@/components/shared/orders/order-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { requireSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/db/mongoose';
import { CustomerModel } from '@/models/customer.model';
import { Types } from 'mongoose';

type CustomerLite = {
  _id: Types.ObjectId;
  name: string;
  company?: string | null;
};

export const metadata: Metadata = {
  title: 'Create Order',
};

export default async function NewOrderPage() {
  const session = await requireSession();
  await connectMongoose();

  const customers = (await CustomerModel.find({ userId: session.user.id })
    .select('name company')
    .sort({ name: 1 })
    .lean()) as unknown as CustomerLite[];

  if (!customers.length) {
    return (
      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-4 p-8 text-center">
          <h1 className="text-2xl font-semibold">Create a customer first</h1>
          <p className="text-sm text-muted-foreground">
            Orders belong to one customer, so you need at least one customer before creating an
            order.
          </p>
          <Button asChild>
            <Link href="/customers/new">Create Customer</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

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
        customers={customerOptions}
        description="Orders are auto-numbered and linked to a customer you own."
        submitLabel="Create Order"
        title="Order Details"
      />
    </div>
  );
}
