import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { OrderDetailView } from '@/components/shared/orders/order-detail-view';
import { PageHeader } from '@/components/shared/page-header';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { computeOrderFinancials, resolveOrderValue } from '@/lib/finance/order-financials';
import { CustomerModel } from '@/models/customer.model';
import { ExpenseModel } from '@/models/expense.model';
import { OrderModel } from '@/models/order.model';
import { PaymentModel } from '@/models/payment.model';
import type { OrderStatus } from '@/types/domain';

export const metadata: Metadata = {
  title: 'Order Detail',
};

const FLASH_MESSAGES: Record<string, Record<string, string>> = {
  payment: {
    created: 'Payment recorded.',
    updated: 'Payment updated.',
    deleted: 'Payment deleted.',
  },
  expense: {
    created: 'Expense added.',
    updated: 'Expense updated.',
  },
};

function getFlashMessage(search: Record<string, string | string[] | undefined>) {
  for (const [key, messages] of Object.entries(FLASH_MESSAGES)) {
    const value = search[key];
    if (typeof value === 'string' && messages[value]) {
      return messages[value];
    }
  }
  return '';
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const { id } = await Promise.resolve(params);
  const flash = getFlashMessage(await Promise.resolve(searchParams));

  if (isDemoUserId(session.user.id)) {
    const detail = demoStore.getOrder(id);
    if (!detail) notFound();

    return (
      <OrderDetailView
        demo
        flash={flash}
        order={{
          ...detail.order,
          deliveryDate: detail.order.deliveryDate ?? null,
        }}
        customer={{
          id: detail.order.customerId,
          name: detail.customer?.name ?? '',
          company: detail.customer?.company ?? '',
          country: detail.customer?.country ?? '',
        }}
        financials={detail.financials}
        payments={detail.payments}
        expenseCount={detail.expenses.length}
      />
    );
  }

  if (!Types.ObjectId.isValid(id)) notFound();

  const db = await tryConnectMongoose();
  if (!db) {
    return (
      <div className="space-y-6">
        <PageHeader title="Order" description="Database unavailable." />
        <DemoModeBanner />
      </div>
    );
  }

  const userObjectId = new Types.ObjectId(session.user.id);
  const orderObjectId = new Types.ObjectId(id);
  const order = (await OrderModel.findOne({
    _id: orderObjectId,
    userId: userObjectId,
  }).lean()) as Record<string, unknown> | null;
  if (!order) notFound();

  const [customer, paymentDocs, expenseDocs] = await Promise.all([
    CustomerModel.findOne({ _id: order.customerId, userId: userObjectId }).lean() as Promise<Record<
      string,
      unknown
    > | null>,
    PaymentModel.find({ orderId: orderObjectId, userId: userObjectId })
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean(),
    // Only amounts are needed: expenses feed the financial overview and the delete count.
    ExpenseModel.find({ orderId: orderObjectId, userId: userObjectId }).select('amount').lean(),
  ]);

  const financials = computeOrderFinancials({
    orderValue: resolveOrderValue(order as { orderValue?: number; receivedAmount?: number }),
    payments: paymentDocs.map((payment) => ({ amount: Number(payment.amount) })),
    expenses: expenseDocs.map((expense) => ({ amount: Number(expense.amount) })),
  });

  return (
    <OrderDetailView
      flash={flash}
      order={{
        id: String(order._id),
        orderNumber: order.orderNumber as string,
        productName: order.productName as string,
        quantity: order.quantity as number,
        status: order.status as OrderStatus,
        currency: String(order.currency ?? 'PKR'),
        orderDate: new Date(order.orderDate as Date).toISOString(),
        deliveryDate: order.deliveryDate
          ? new Date(order.deliveryDate as Date).toISOString()
          : null,
        notes: (order.notes as string) ?? '',
        createdAt: new Date(order.createdAt as Date).toISOString(),
        updatedAt: new Date(order.updatedAt as Date).toISOString(),
      }}
      customer={{
        id: String(order.customerId),
        name: (customer?.name as string) ?? '',
        company: (customer?.company as string) ?? '',
        country: (customer?.country as string) ?? '',
      }}
      financials={financials}
      payments={paymentDocs.map((payment) => ({
        id: String(payment._id),
        amount: Number(payment.amount),
        paymentDate: new Date(payment.paymentDate as Date).toISOString(),
        method: String(payment.method),
        referenceNumber: (payment.referenceNumber as string) ?? '',
        notes: (payment.notes as string) ?? '',
        originalAmount: (payment.originalAmount as number | null) ?? null,
        originalCurrency: (payment.originalCurrency as string | null) ?? null,
        exchangeRate: (payment.exchangeRate as number | null) ?? null,
      }))}
      expenseCount={expenseDocs.length}
    />
  );
}
