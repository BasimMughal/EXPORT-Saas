import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { PageHeader } from '@/components/shared/page-header';
import { ReportExportActions } from '@/components/shared/reports/report-export-actions';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { computeOrderFinancials, resolveOrderValue } from '@/lib/finance/order-financials';
import { formatCurrency, formatDateDisplay } from '@/lib/formatters';
import { getDashboardAnalytics } from '@/lib/services/analytics.service';
import { CustomerModel } from '@/models/customer.model';
import { ExpenseModel } from '@/models/expense.model';
import { ExpenseCategoryModel } from '@/models/expense-category.model';
import { OrderModel } from '@/models/order.model';
import { PaymentModel } from '@/models/payment.model';
import { Types } from 'mongoose';

export const metadata: Metadata = {
  title: 'Reports',
};

export default async function ReportsPage() {
  const session = await requireSession();
  const db = await tryConnectMongoose();
  const useDemo = isDemoUserId(session.user.id);
  const analytics = await getDashboardAnalytics(session.user.id);

  const payload = useDemo
    ? demoStore.getReportData()
    : await (async () => {
        const userObjectId = new Types.ObjectId(session.user.id);
        const [customers, orders, expenses, categories, payments] = await Promise.all([
          CustomerModel.find({ userId: userObjectId }).lean(),
          OrderModel.find({ userId: userObjectId }).lean(),
          ExpenseModel.find({ userId: userObjectId }).lean(),
          ExpenseCategoryModel.find({ userId: userObjectId }).lean(),
          PaymentModel.find({ userId: userObjectId }).lean(),
        ]);
        const categoryMap = new Map(categories.map((c) => [String(c._id), c.name as string]));
        const customerMap = new Map(
          customers.map((c) => [String(c._id), ((c.company as string) || (c.name as string))]),
        );
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

        return {
          generatedAt: new Date().toISOString(),
          kpis: analytics.kpis,
          yearly: analytics.yearly,
          displayCurrency: analytics.displayCurrency,
          monthly: analytics.monthly,
          customers: customers.map((c) => ({
            id: String(c._id),
            name: c.name,
            company: c.company,
            country: c.country,
            email: c.email,
            phone: c.phone,
          })),
          orders: orders.map((o) => {
            const orderId = String(o._id);
            const financials = computeOrderFinancials({
              orderValue: resolveOrderValue(o as { orderValue?: number; receivedAmount?: number }),
              payments: paymentsByOrder.get(orderId) ?? [],
              expenses: expensesByOrder.get(orderId) ?? [],
            });
            return {
              orderNumber: o.orderNumber,
              customerName: customerMap.get(String(o.customerId)) ?? '',
              productName: o.productName,
              status: o.status,
              quantity: o.quantity,
              orderValue: financials.orderValue,
              currency: o.currency ?? 'PKR',
              orderDate: new Date(o.orderDate as Date).toISOString(),
              financials,
            };
          }),
          payments: payments.map((p) => {
            const order = orderMap.get(String(p.orderId));
            return {
              orderNumber: (order?.orderNumber as string) ?? '',
              customerName: order ? customerMap.get(String(order.customerId)) ?? '' : '',
              amount: p.amount,
              currency: order?.currency ?? 'PKR',
              paymentDate: new Date(p.paymentDate as Date).toISOString(),
              method: p.method,
              referenceNumber: p.referenceNumber,
            };
          }),
          expenses: expenses.map((e) => ({
            title: e.title,
            categoryName: categoryMap.get(String(e.categoryId)) ?? '',
            orderNumber: e.orderId
              ? ((orderMap.get(String(e.orderId))?.orderNumber as string) ?? '')
              : '',
            amount: e.amount,
            currency: e.currency ?? 'PKR',
            expenseDate: new Date(e.expenseDate as Date).toISOString(),
          })),
        };
      })();

  const displayCurrency = payload.displayCurrency ?? analytics.displayCurrency ?? 'PKR';

  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Reports' }]} />
      {useDemo ? <DemoModeBanner /> : null}
      {!db && !useDemo ? <DemoModeBanner /> : null}
      <PageHeader
        title="Reports & exports"
        description="Customer, order, payment, outstanding, expense, and profit summaries."
        actions={<ReportExportActions payload={{ ...payload, displayCurrency }} />}
      />

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {[
          ['Customers', String(payload.kpis.totalCustomers)],
          ['Orders', String(payload.kpis.totalOrders)],
          ['Order value', formatCurrency(payload.kpis.totalOrderValue, displayCurrency)],
          ['Payments received', formatCurrency(payload.kpis.totalPaymentsReceived, displayCurrency)],
          ['Outstanding', formatCurrency(payload.kpis.totalOutstandingBalance, displayCurrency)],
          ['Expenses', formatCurrency(payload.kpis.totalExpenses, displayCurrency)],
          ['Contract profit', formatCurrency(payload.kpis.totalContractProfit, displayCurrency)],
          ['Cash profit', formatCurrency(payload.kpis.totalCashProfit, displayCurrency)],
        ].map(([label, value]) => (
          <div key={label} className="surface-card p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <p className="font-display mt-2 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      {payload.yearly ? (
        <section className="surface-card p-5">
          <h2 className="font-display text-lg font-semibold">Yearly report ({payload.yearly.year})</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-muted-foreground">Revenue</p>
              <p className="font-semibold">{formatCurrency(payload.yearly.revenue, displayCurrency)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expenses</p>
              <p className="font-semibold">{formatCurrency(payload.yearly.expenses, displayCurrency)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Contract profit</p>
              <p className="font-semibold">
                {formatCurrency(payload.yearly.contractProfit, displayCurrency)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Cash profit</p>
              <p className="font-semibold">
                {formatCurrency(payload.yearly.cashProfit, displayCurrency)}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-semibold">Outstanding balances</h2>
          <div className="mt-4 space-y-2">
            {payload.orders
              .filter((order) => Number((order.financials as { outstandingBalance?: number } | undefined)?.outstandingBalance ?? 0) > 0)
              .slice(0, 8)
              .map((order) => {
                const financials = order.financials as {
                  outstandingBalance: number;
                  totalPaymentsReceived: number;
                  orderValue: number;
                };
                return (
                  <div
                    key={String(order.orderNumber)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{String(order.orderNumber)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {String(order.customerName)} · paid{' '}
                        {formatCurrency(
                          financials.totalPaymentsReceived,
                          String(order.currency ?? displayCurrency),
                        )}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(
                        financials.outstandingBalance,
                        String(order.currency ?? displayCurrency),
                      )}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-semibold">Payment history</h2>
          <div className="mt-4 space-y-2">
            {(payload.payments ?? []).slice(0, 8).map((payment, index) => (
              <div
                key={`${String(payment.orderNumber)}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{String(payment.orderNumber)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {String(payment.method)} · {formatDateDisplay(String(payment.paymentDate))}
                  </p>
                </div>
                <p className="font-medium">
                  {formatCurrency(
                    Number(payment.amount ?? 0),
                    String(payment.currency ?? displayCurrency),
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
