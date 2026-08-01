import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { OrderFinancialSummary } from '@/components/shared/orders/order-financial-summary';
import { OrderStatusBadge } from '@/components/shared/orders/order-status-badge';
import { PageHeader } from '@/components/shared/page-header';
import { PaymentTable } from '@/components/shared/payments/payment-table';
import { Button } from '@/components/ui/button';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { computeOrderFinancials, resolveOrderValue } from '@/lib/finance/order-financials';
import { formatCurrency, formatDateDisplay } from '@/lib/formatters';
import { CustomerModel } from '@/models/customer.model';
import { ExpenseModel } from '@/models/expense.model';
import { ExpenseCategoryModel } from '@/models/expense-category.model';
import { OrderModel } from '@/models/order.model';
import { PaymentModel } from '@/models/payment.model';

export const metadata: Metadata = {
  title: 'Order Detail',
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const { id } = await Promise.resolve(params);
  const rawSearch = await Promise.resolve(searchParams);
  const flash =
    rawSearch.payment === 'created'
      ? 'Payment recorded.'
      : rawSearch.payment === 'updated'
        ? 'Payment updated.'
        : rawSearch.payment === 'deleted'
          ? 'Payment deleted.'
          : '';

  const useDemo = isDemoUserId(session.user.id);

  if (useDemo) {
    const detail = demoStore.getOrder(id);
    if (!detail) notFound();

    return (
      <OrderDetailView
        flash={flash}
        demo
        orderId={detail.order.id}
        orderNumber={detail.order.orderNumber}
        productName={detail.order.productName}
        description={detail.order.description}
        quantity={detail.order.quantity}
        status={detail.order.status}
        currency={detail.order.currency}
        orderDate={detail.order.orderDate}
        deliveryDate={detail.order.deliveryDate}
        notes={detail.order.notes}
        createdAt={detail.order.createdAt}
        updatedAt={detail.order.updatedAt}
        customerName={detail.customer?.name ?? 'Unknown'}
        customerCompany={detail.customer?.company ?? ''}
        customerCountry={detail.customer?.country ?? ''}
        customerId={detail.order.customerId}
        financials={detail.financials}
        payments={detail.payments.map((p) => ({
          id: p.id,
          orderId: p.orderId,
          orderNumber: detail.order.orderNumber,
          amount: p.amount,
          currency: detail.order.currency,
          paymentDate: p.paymentDate,
          method: p.method,
          referenceNumber: p.referenceNumber,
          notes: p.notes,
        }))}
        expenses={detail.expenses.map((e) => ({
          id: e.id,
          title: e.title,
          categoryName: e.categoryName,
          amount: e.amount,
          currency: e.currency,
          expenseDate: e.expenseDate,
        }))}
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

  const [customer, paymentDocs, expenseDocs, categories] = await Promise.all([
    CustomerModel.findOne({ _id: order.customerId, userId: userObjectId }).lean() as Promise<Record<
      string,
      unknown
    > | null>,
    PaymentModel.find({ orderId: orderObjectId, userId: userObjectId }).sort({ paymentDate: -1 }).lean(),
    ExpenseModel.find({ orderId: orderObjectId, userId: userObjectId }).sort({ expenseDate: -1 }).lean(),
    ExpenseCategoryModel.find({ userId: userObjectId }).lean(),
  ]);

  const categoryMap = new Map(categories.map((c) => [String(c._id), c.name as string]));
  const currency = String(order.currency ?? 'PKR');
  const financials = computeOrderFinancials({
    orderValue: resolveOrderValue(order as { orderValue?: number; receivedAmount?: number }),
    payments: paymentDocs.map((p) => ({ amount: Number(p.amount) })),
    expenses: expenseDocs.map((e) => ({ amount: Number(e.amount) })),
  });

  return (
    <OrderDetailView
      flash={flash}
      orderId={String(order._id)}
      orderNumber={order.orderNumber as string}
      productName={order.productName as string}
      description={(order.description as string) ?? ''}
      quantity={order.quantity as number}
      status={order.status as 'pending' | 'in_progress' | 'completed' | 'abandoned'}
      currency={currency}
      orderDate={new Date(order.orderDate as Date).toISOString()}
      deliveryDate={order.deliveryDate ? new Date(order.deliveryDate as Date).toISOString() : null}
      notes={(order.notes as string) ?? ''}
      createdAt={new Date(order.createdAt as Date).toISOString()}
      updatedAt={new Date(order.updatedAt as Date).toISOString()}
      customerName={(customer?.name as string) ?? 'Unknown'}
      customerCompany={(customer?.company as string) ?? ''}
      customerCountry={(customer?.country as string) ?? ''}
      customerId={String(order.customerId)}
      financials={financials}
      payments={paymentDocs.map((p) => ({
        id: String(p._id),
        orderId: String(p.orderId),
        orderNumber: order.orderNumber as string,
        amount: Number(p.amount),
        currency,
        paymentDate: new Date(p.paymentDate as Date).toISOString(),
        method: String(p.method),
        referenceNumber: (p.referenceNumber as string) ?? '',
        notes: (p.notes as string) ?? '',
      }))}
      expenses={expenseDocs.map((e) => ({
        id: String(e._id),
        title: e.title as string,
        categoryName: categoryMap.get(String(e.categoryId)) ?? '—',
        amount: Number(e.amount),
        currency: String(e.currency ?? currency),
        expenseDate: new Date(e.expenseDate as Date).toISOString(),
      }))}
    />
  );
}

function OrderDetailView(props: {
  demo?: boolean;
  flash: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  description: string;
  quantity: number;
  status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
  currency: string;
  orderDate: string;
  deliveryDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerCompany: string;
  customerCountry: string;
  customerId: string;
  financials: ReturnType<typeof computeOrderFinancials>;
  payments: Array<{
    id: string;
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: string;
    paymentDate: string;
    method: string;
    referenceNumber: string;
    notes: string;
  }>;
  expenses: Array<{
    id: string;
    title: string;
    categoryName: string;
    amount: number;
    currency: string;
    expenseDate: string;
  }>;
}) {
  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Workspace', href: '/dashboard' },
          { label: 'Orders', href: '/orders' },
          { label: props.orderNumber },
        ]}
      />
      {props.demo ? <DemoModeBanner /> : null}
      <PageHeader
        title={props.orderNumber}
        description={props.productName}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={`/orders/${props.orderId}/statement`}>Order statement</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={`/payments/new?orderId=${props.orderId}`}>Add payment</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={`/orders/${props.orderId}/edit`}>Edit order</Link>
            </Button>
          </div>
        }
      />

      {props.flash ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {props.flash}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Order information</h2>
            <OrderStatusBadge status={props.status} />
          </div>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Customer</dt>
              <dd className="font-medium">
                <Link href={`/customers/${props.customerId}`} className="hover:underline">
                  {props.customerCompany || props.customerName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Country</dt>
              <dd className="font-medium">{props.customerCountry || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Quantity</dt>
              <dd className="font-medium">{props.quantity.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Currency</dt>
              <dd className="font-medium">{props.currency}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Order date</dt>
              <dd className="font-medium">{formatDateDisplay(props.orderDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Delivery date</dt>
              <dd className="font-medium">{formatDateDisplay(props.deliveryDate)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Description</dt>
              <dd className="font-medium">{props.description || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="font-medium">{props.notes || '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="surface-card space-y-4 p-5">
          <h2 className="font-display text-lg font-semibold">Financial summary</h2>
          <OrderFinancialSummary financials={props.financials} currency={props.currency} />
          <p className="text-xs text-muted-foreground">
            Created {formatDateDisplay(props.createdAt)} · Updated {formatDateDisplay(props.updatedAt)}
          </p>
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Payment history</h2>
          <Button asChild size="sm" className="rounded-xl">
            <Link href={`/payments/new?orderId=${props.orderId}`}>Add payment</Link>
          </Button>
        </div>
        <PaymentTable rows={props.payments} showOrder={false} returnOrderId={props.orderId} />
      </section>

      <section className="surface-card space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Expense history</h2>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href={`/expenses/new?orderId=${props.orderId}`}>Add expense</Link>
          </Button>
        </div>
        {props.expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses linked to this order.</p>
        ) : (
          <div className="space-y-2">
            {props.expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{expense.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {expense.categoryName} · {formatDateDisplay(expense.expenseDate)}
                  </p>
                </div>
                <p className="font-medium">{formatCurrency(expense.amount, expense.currency)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
