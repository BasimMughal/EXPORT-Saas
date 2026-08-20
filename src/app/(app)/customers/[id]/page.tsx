import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { OrderStatusBadge } from '@/components/shared/orders/order-status-badge';
import { PageHeader } from '@/components/shared/page-header';
import { PaymentTable } from '@/components/shared/payments/payment-table';
import { Button } from '@/components/ui/button';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import {
  convertCurrency,
  DEFAULT_CURRENCY,
  isCurrencyCode,
  type CurrencyCode,
} from '@/config/currency';
import { getPreferredCurrency } from '@/lib/currency/preferred';
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
  title: 'Customer History',
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await Promise.resolve(params);
  const useDemo = isDemoUserId(session.user.id);

  if (useDemo) {
    const history = demoStore.getCustomerHistory(id);
    if (!history) notFound();
    const { customer, orders, payments, expenses, totals, displayCurrency } = history;

    return (
      <CustomerHistoryView
        demo
        customer={customer}
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          productName: o.productName,
          status: o.status,
          currency: o.currency,
          orderDate: o.orderDate,
          financials: o.financials,
        }))}
        payments={payments.map((p) => ({
          id: p.id,
          orderId: p.orderId,
          orderNumber: p.orderNumber,
          amount: p.amount,
          currency: p.currency,
          paymentDate: p.paymentDate,
          method: p.method,
          referenceNumber: p.referenceNumber,
          notes: p.notes,
        }))}
        expenses={expenses.map((e) => ({
          id: e.id,
          title: e.title,
          categoryName: e.categoryName,
          orderNumber: e.orderNumber,
          amount: e.amount,
          currency: e.currency,
          expenseDate: e.expenseDate,
        }))}
        totals={totals}
        displayCurrency={displayCurrency}
      />
    );
  }

  if (!Types.ObjectId.isValid(id)) notFound();
  const db = await tryConnectMongoose();
  if (!db) {
    return (
      <div className="space-y-6">
        <PageHeader title="Customer" description="Database unavailable." />
        <DemoModeBanner />
      </div>
    );
  }

  const userObjectId = new Types.ObjectId(session.user.id);
  const customerObjectId = new Types.ObjectId(id);
  const preferred = await getPreferredCurrency(session.user.id);

  const customer = (await CustomerModel.findOne({
    _id: customerObjectId,
    userId: userObjectId,
  }).lean()) as Record<string, unknown> | null;
  if (!customer) notFound();

  const orders = await OrderModel.find({
    userId: userObjectId,
    customerId: customerObjectId,
  })
    .sort({ orderDate: -1 })
    .lean();

  const orderIds = orders.map((o) => o._id);
  const [payments, expenses, categories] = await Promise.all([
    PaymentModel.find({ userId: userObjectId, orderId: { $in: orderIds } })
      .sort({ paymentDate: -1 })
      .lean(),
    ExpenseModel.find({ userId: userObjectId, orderId: { $in: orderIds } })
      .sort({ expenseDate: -1 })
      .lean(),
    ExpenseCategoryModel.find({ userId: userObjectId }).lean(),
  ]);

  const categoryMap = new Map(categories.map((c) => [String(c._id), c.name as string]));
  const orderMap = new Map(orders.map((o) => [String(o._id), o]));

  const paymentsByOrder = new Map<string, Array<{ amount: number }>>();
  for (const payment of payments) {
    const key = String(payment.orderId);
    const list = paymentsByOrder.get(key) ?? [];
    list.push({ amount: Number(payment.amount) });
    paymentsByOrder.set(key, list);
  }
  const expensesByOrder = new Map<string, Array<{ amount: number }>>();
  for (const expense of expenses) {
    if (!expense.orderId) continue;
    const key = String(expense.orderId);
    const list = expensesByOrder.get(key) ?? [];
    list.push({ amount: Number(expense.amount) });
    expensesByOrder.set(key, list);
  }

  const orderRows = orders.map((order) => {
    const orderId = String(order._id);
    const financials = computeOrderFinancials({
      orderValue: resolveOrderValue(order as { orderValue?: number; receivedAmount?: number }),
      payments: paymentsByOrder.get(orderId) ?? [],
      expenses: expensesByOrder.get(orderId) ?? [],
    });
    return {
      id: orderId,
      orderNumber: order.orderNumber as string,
      productName: order.productName as string,
      status: order.status as 'pending' | 'in_progress' | 'completed' | 'abandoned',
      currency: String(order.currency ?? 'PKR'),
      orderDate: new Date(order.orderDate as Date).toISOString(),
      financials,
    };
  });

  const toPreferred = (amount: number, currency: string) => {
    const code = isCurrencyCode(currency) ? currency : DEFAULT_CURRENCY;
    return convertCurrency(amount, code, preferred);
  };

  const totals = orderRows.reduce(
    (acc, row) => {
      acc.totalOrderValue += toPreferred(row.financials.orderValue, row.currency);
      acc.totalPaymentsReceived += toPreferred(row.financials.totalPaymentsReceived, row.currency);
      acc.totalOutstandingBalance += toPreferred(row.financials.outstandingBalance, row.currency);
      acc.totalExpenses += toPreferred(row.financials.totalExpenses, row.currency);
      acc.totalContractProfit += toPreferred(row.financials.contractProfit, row.currency);
      acc.totalCashProfit += toPreferred(row.financials.cashProfit, row.currency);
      return acc;
    },
    {
      totalOrderValue: 0,
      totalPaymentsReceived: 0,
      totalOutstandingBalance: 0,
      totalExpenses: 0,
      totalContractProfit: 0,
      totalCashProfit: 0,
    },
  );

  return (
    <CustomerHistoryView
      customer={{
        id: String(customer._id),
        name: customer.name as string,
        company: (customer.company as string) ?? '',
        country: customer.country as string,
        phone: (customer.phone as string) ?? '',
        email: (customer.email as string) ?? '',
        notes: (customer.notes as string) ?? '',
        createdAt: new Date(customer.createdAt as Date).toISOString(),
        updatedAt: new Date(customer.updatedAt as Date).toISOString(),
        userId: session.user.id,
      }}
      orders={orderRows}
      payments={payments.map((p) => {
        const order = orderMap.get(String(p.orderId));
        return {
          id: String(p._id),
          orderId: String(p.orderId),
          orderNumber: (order?.orderNumber as string) ?? '',
          amount: Number(p.amount),
          currency: String(order?.currency ?? 'PKR'),
          paymentDate: new Date(p.paymentDate as Date).toISOString(),
          method: String(p.method),
          referenceNumber: (p.referenceNumber as string) ?? '',
          notes: (p.notes as string) ?? '',
        };
      })}
      expenses={expenses.map((e) => {
        const order = e.orderId ? orderMap.get(String(e.orderId)) : null;
        return {
          id: String(e._id),
          title: e.title as string,
          categoryName: categoryMap.get(String(e.categoryId)) ?? '—',
          orderNumber: (order?.orderNumber as string) ?? '',
          amount: Number(e.amount),
          currency: String(e.currency ?? 'PKR'),
          expenseDate: new Date(e.expenseDate as Date).toISOString(),
        };
      })}
      totals={totals}
      displayCurrency={preferred}
    />
  );
}

function CustomerHistoryView(props: {
  demo?: boolean;
  customer: {
    id: string;
    name: string;
    company: string;
    country: string;
    phone: string;
    email: string;
    notes: string;
    createdAt: string;
    updatedAt?: string;
    userId?: string;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    productName: string;
    status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
    currency: string;
    orderDate: string;
    financials: ReturnType<typeof computeOrderFinancials>;
  }>;
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
    orderNumber: string;
    amount: number;
    currency: string;
    expenseDate: string;
  }>;
  totals: {
    totalOrderValue: number;
    totalPaymentsReceived: number;
    totalOutstandingBalance: number;
    totalExpenses: number;
    totalContractProfit: number;
    totalCashProfit: number;
  };
  displayCurrency: CurrencyCode;
}) {
  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Workspace', href: '/dashboard' },
          { label: 'Customers', href: '/customers' },
          { label: props.customer.name },
        ]}
      />
      {props.demo ? <DemoModeBanner /> : null}
      <PageHeader
        title={props.customer.company || props.customer.name}
        description="Complete order, payment, expense, and profit history."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={`/customers/${props.customer.id}/edit`}>Edit</Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link href={`/orders/new?customerId=${props.customer.id}`}>New order</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="surface-card space-y-3 p-5 text-sm">
          <h2 className="font-display text-lg font-semibold">Customer information</h2>
          <p>
            <span className="text-muted-foreground">Name: </span>
            {props.customer.name}
          </p>
          <p>
            <span className="text-muted-foreground">Company: </span>
            {props.customer.company || '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Country: </span>
            {props.customer.country}
          </p>
          <p>
            <span className="text-muted-foreground">Email: </span>
            {props.customer.email || '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Phone: </span>
            {props.customer.phone || '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Notes: </span>
            {props.customer.notes || '—'}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Total revenue (payments)', props.totals.totalPaymentsReceived],
            ['Outstanding balance', props.totals.totalOutstandingBalance],
            ['Total expenses', props.totals.totalExpenses],
            ['Contract profit', props.totals.totalContractProfit],
            ['Cash profit', props.totals.totalCashProfit],
            ['Order value', props.totals.totalOrderValue],
          ].map(([label, value]) => (
            <div key={String(label)} className="surface-card p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
              <p className="font-display mt-1 text-xl font-semibold">
                {formatCurrency(Number(value), props.displayCurrency)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold">Orders & invoices</h2>
        <div className="space-y-2">
          {props.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            props.orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {order.productName} · {formatDateDisplay(order.orderDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(order.financials.orderValue, order.currency)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Cash {formatCurrency(order.financials.cashProfit, order.currency)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link href={`/orders/${order.id}/statement`}>Invoice</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold">Payment history</h2>
        <PaymentTable rows={props.payments} />
      </section>

      <section className="surface-card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold">Expense history</h2>
        {props.expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses for this customer&apos;s orders.</p>
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
                    {expense.categoryName} · {expense.orderNumber || '—'} ·{' '}
                    {formatDateDisplay(expense.expenseDate)}
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
