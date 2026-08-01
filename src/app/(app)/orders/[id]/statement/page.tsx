import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import {
  OrderStatementView,
  type StatementPayload,
} from '@/components/shared/orders/order-statement-view';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { computeOrderFinancials, resolveOrderValue } from '@/lib/finance/order-financials';
import { CustomerModel } from '@/models/customer.model';
import { ExpenseModel } from '@/models/expense.model';
import { ExpenseCategoryModel } from '@/models/expense-category.model';
import { OrderModel } from '@/models/order.model';
import { PaymentModel } from '@/models/payment.model';

export const metadata: Metadata = {
  title: 'Order Statement',
};

export default async function OrderStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await Promise.resolve(params);
  const useDemo = isDemoUserId(session.user.id);

  let payload: StatementPayload | null = null;

  if (useDemo) {
    const detail = demoStore.getOrder(id);
    if (!detail) notFound();
    payload = {
      orderNumber: detail.order.orderNumber,
      productName: detail.order.productName,
      description: detail.order.description,
      quantity: detail.order.quantity,
      status: detail.order.status,
      currency: detail.order.currency,
      orderDate: detail.order.orderDate,
      deliveryDate: detail.order.deliveryDate,
      notes: detail.order.notes,
      createdAt: detail.order.createdAt,
      updatedAt: detail.order.updatedAt,
      customer: {
        name: detail.customer?.name ?? '',
        company: detail.customer?.company ?? '',
        country: detail.customer?.country ?? '',
        phone: detail.customer?.phone ?? '',
        email: detail.customer?.email ?? '',
      },
      payments: detail.payments,
      expenses: detail.expenses.map((e) => ({
        title: e.title,
        categoryName: e.categoryName,
        amount: e.amount,
        expenseDate: e.expenseDate,
        notes: e.notes,
      })),
      financials: detail.financials,
    };
  } else {
    if (!Types.ObjectId.isValid(id)) notFound();
    const db = await tryConnectMongoose();
    if (!db) {
      return (
        <div className="space-y-6">
          <PageHeader title="Order statement" description="Database unavailable." />
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

  const [customer, payments, expenses, categories] = await Promise.all([
    CustomerModel.findOne({ _id: order.customerId, userId: userObjectId }).lean() as Promise<Record<
      string,
      unknown
    > | null>,
    PaymentModel.find({ orderId: orderObjectId, userId: userObjectId }).sort({ paymentDate: 1 }).lean(),
    ExpenseModel.find({ orderId: orderObjectId, userId: userObjectId }).sort({ expenseDate: 1 }).lean(),
    ExpenseCategoryModel.find({ userId: userObjectId }).lean(),
  ]);

    const categoryMap = new Map(categories.map((c) => [String(c._id), c.name as string]));
    const currency = String(order.currency ?? 'PKR');
    payload = {
      orderNumber: order.orderNumber as string,
      productName: order.productName as string,
      description: (order.description as string) ?? '',
      quantity: order.quantity as number,
      status: String(order.status),
      currency,
      orderDate: new Date(order.orderDate as Date).toISOString(),
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate as Date).toISOString() : null,
      notes: (order.notes as string) ?? '',
      createdAt: new Date(order.createdAt as Date).toISOString(),
      updatedAt: new Date(order.updatedAt as Date).toISOString(),
      customer: {
        name: (customer?.name as string) ?? '',
        company: (customer?.company as string) ?? '',
        country: (customer?.country as string) ?? '',
        phone: (customer?.phone as string) ?? '',
        email: (customer?.email as string) ?? '',
      },
      payments: payments.map((p) => ({
        amount: Number(p.amount),
        paymentDate: new Date(p.paymentDate as Date).toISOString(),
        method: String(p.method),
        referenceNumber: (p.referenceNumber as string) ?? '',
        notes: (p.notes as string) ?? '',
      })),
      expenses: expenses.map((e) => ({
        title: e.title as string,
        categoryName: categoryMap.get(String(e.categoryId)) ?? '—',
        amount: Number(e.amount),
        expenseDate: new Date(e.expenseDate as Date).toISOString(),
        notes: (e.notes as string) ?? '',
      })),
      financials: computeOrderFinancials({
        orderValue: resolveOrderValue(order as { orderValue?: number; receivedAmount?: number }),
        payments: payments.map((p) => ({ amount: Number(p.amount) })),
        expenses: expenses.map((e) => ({ amount: Number(e.amount) })),
      }),
    };
  }

  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Workspace', href: '/dashboard' },
          { label: 'Orders', href: '/orders' },
          { label: payload.orderNumber, href: `/orders/${id}` },
          { label: 'Statement' },
        ]}
      />
      {useDemo ? <DemoModeBanner /> : null}
      <PageHeader
        title="Order statement"
        description="Live printable statement generated from payments and expenses."
        actions={
          <Button asChild variant="outline" className="rounded-xl print:hidden">
            <Link href={`/orders/${id}`}>Back to order</Link>
          </Button>
        }
      />
      <OrderStatementView payload={payload} />
    </div>
  );
}
