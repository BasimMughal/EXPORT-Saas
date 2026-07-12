import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { updateOrderAction } from '@/app/(app)/orders/actions';
import { OrderForm } from '@/components/shared/orders/order-form';
import { Button } from '@/components/ui/button';
import { requireSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/db/mongoose';
import { formatDateInput } from '@/lib/formatters';
import { CustomerModel } from '@/models/customer.model';
import { OrderModel } from '@/models/order.model';

export const metadata: Metadata = {
  title: 'Edit Order',
};

type CustomerLite = {
  _id: Types.ObjectId;
  name: string;
  company?: string | null;
};

export default async function EditOrderPage({
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

  const [order, customers] = await Promise.all([
    OrderModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(session.user.id),
    }).lean(),
    CustomerModel.find({ userId: session.user.id }).select('name company').sort({ name: 1 }).lean(),
  ]) as unknown as [
    {
      _id: Types.ObjectId;
      customerId: Types.ObjectId;
      orderNumber: string;
      productName: string;
      description?: string | null;
      quantity: number;
      receivedAmount: number;
      orderDate: Date;
      deliveryDate: Date | null;
      status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
      notes?: string | null;
    } | null,
    CustomerLite[],
  ];

  if (!order) {
    notFound();
  }

  const customerOptions = customers.map((customer) => ({
    id: customer._id.toString(),
    label: customer.company ? `${customer.name} - ${customer.company}` : customer.name,
  }));

  const currentCustomerExists = customerOptions.some((customer) => customer.id === order.customerId.toString());
  if (!currentCustomerExists) {
    customerOptions.unshift({
      id: order.customerId.toString(),
      label: 'Deleted customer',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Edit Order</h1>
          <p className="text-sm text-muted-foreground">Orders remain locked to the account that created them.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/orders">Back</Link>
        </Button>
      </div>

      <OrderForm
        action={updateOrderAction.bind(null, id)}
        customers={customerOptions}
        description="Update order details with server-side validation and ownership checks."
        initialValues={{
          orderNumber: order.orderNumber,
          customerId: order.customerId.toString(),
          productName: order.productName,
          description: order.description ?? '',
          quantity: String(order.quantity),
          receivedAmount: String(order.receivedAmount),
          orderDate: formatDateInput(order.orderDate),
          deliveryDate: formatDateInput(order.deliveryDate),
          status: order.status,
          notes: order.notes ?? '',
        }}
        submitLabel="Save Changes"
        title="Order Details"
      />
    </div>
  );
}
