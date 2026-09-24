import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { CustomerActionsMenu } from '@/components/shared/customers/customer-actions-menu';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { OrderStatusBadge } from '@/components/shared/orders/order-status-badge';
import { PageHeader } from '@/components/shared/page-header';
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
import { OrderModel } from '@/models/order.model';
import { PaymentModel } from '@/models/payment.model';

export const metadata: Metadata = {
  title: 'Customer History',
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await Promise.resolve(params);
  const useDemo = isDemoUserId(session.user.id);

  if (useDemo) {
    const history = demoStore.getCustomerHistory(id);
    if (!history) notFound();
    const { customer, orders, totals, displayCurrency } = history;

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
  // Only amounts are needed: payments and expenses feed the per-order totals below.
  const [payments, expenses] = await Promise.all([
    PaymentModel.find({ userId: userObjectId, orderId: { $in: orderIds } })
      .select('orderId amount')
      .lean(),
    ExpenseModel.find({ userId: userObjectId, orderId: { $in: orderIds } })
      .select('orderId amount')
      .lean(),
  ]);

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
          <CustomerActionsMenu
            customerId={props.customer.id}
            customerName={props.customer.company || props.customer.name}
            orderCount={props.orders.length}
          />
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
    </div>
  );
}
