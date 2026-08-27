import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { createExpenseAction } from '@/app/(app)/expenses/actions';
import { updateOrderAction } from '@/app/(app)/orders/actions';
import { ExpenseForm } from '@/components/shared/expenses/expense-form';
import { OrderForm } from '@/components/shared/orders/order-form';
import { Button } from '@/components/ui/button';
import { DEFAULT_CURRENCY, type CurrencyCode } from '@/config/currency';
import { requireSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/db/mongoose';
import { formatDateInput } from '@/lib/formatters';
import { CustomerModel } from '@/models/customer.model';
import { ExpenseCategoryModel } from '@/models/expense-category.model';
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const { id } = await Promise.resolve(params);
  const rawSearch = await Promise.resolve(searchParams);
  const flash = rawSearch.expense === 'created' ? 'Expense added to this order.' : '';

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectMongoose();

  const [order, customers, categories] = (await Promise.all([
    OrderModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(session.user.id),
    }).lean(),
    CustomerModel.find({ userId: session.user.id }).select('name company').sort({ name: 1 }).lean(),
    ExpenseCategoryModel.find({ userId: new Types.ObjectId(session.user.id) })
      .select('name')
      .sort({ name: 1 })
      .lean(),
  ])) as unknown as [
    {
      _id: Types.ObjectId;
      customerId: Types.ObjectId;
      orderNumber: string;
      productName: string;
      description?: string | null;
      quantity: number;
      orderValue?: number;
      receivedAmount?: number;
      currency?: string;
      orderDate: Date;
      deliveryDate: Date | null;
      status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
      notes?: string | null;
    } | null,
    CustomerLite[],
    Array<{
      _id: Types.ObjectId;
      name: string;
    }>,
  ];

  if (!order) {
    notFound();
  }

  const customerOptions = customers.map((customer) => ({
    id: customer._id.toString(),
    label: customer.company ? `${customer.name} - ${customer.company}` : customer.name,
  }));

  const currentCustomerExists = customerOptions.some(
    (customer) => customer.id === order.customerId.toString(),
  );
  if (!currentCustomerExists) {
    customerOptions.unshift({
      id: order.customerId.toString(),
      label: 'Deleted customer',
    });
  }

  const orderCurrency = (order.currency as CurrencyCode | undefined) ?? DEFAULT_CURRENCY;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Edit Order</h1>
          <p className="text-sm text-muted-foreground">
            Orders remain locked to the account that created them.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/orders">Back</Link>
        </Button>
      </div>

      {flash ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {flash}
        </div>
      ) : null}

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
          orderValue: String(order.orderValue ?? order.receivedAmount ?? 0),
          currency: order.currency ?? 'PKR',
          orderDate: formatDateInput(order.orderDate),
          deliveryDate: formatDateInput(order.deliveryDate),
          status: order.status,
          notes: order.notes ?? '',
        }}
        submitLabel="Save Changes"
        title="Order Details"
      />

      <ExpenseForm
        action={createExpenseAction}
        categories={categories.map((category) => ({
          id: String(category._id),
          label: category.name,
        }))}
        orders={[
          {
            id,
            label: `${order.orderNumber} — ${order.productName}`,
            currency: orderCurrency,
          },
        ]}
        title="Add expense"
        description="Add expenses for this order without leaving the edit screen."
        submitLabel="Save expense"
        defaultValues={{
          orderId: id,
          currency: orderCurrency,
        }}
        lockOrderId
        returnTo={`/orders/${id}/edit?expense=created`}
      />
    </div>
  );
}
