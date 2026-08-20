import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUpRight,
  CircleDollarSign,
  Package,
  Receipt,
  Scale,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

import {
  ExpenseBreakdownChart,
  ProfitBarChart,
  RevenueExpenseChart,
} from '@/components/shared/dashboard/charts';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateDisplay } from '@/lib/formatters';
import { getDashboardAnalytics } from '@/lib/services/analytics.service';
import { requireSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardAnalytics(session.user.id);
  const { kpis } = data;
  const currency = data.displayCurrency;

  const cards = [
    { label: 'Total Customers', value: String(kpis.totalCustomers), hint: 'Active buyers', icon: Users },
    { label: 'Total Orders', value: String(kpis.totalOrders), hint: `${kpis.pendingOrders} pending`, icon: Package },
    {
      label: 'Pending / In progress',
      value: `${kpis.pendingOrders} / ${kpis.inProgressOrders}`,
      hint: `${kpis.completedOrders} completed · ${kpis.abandonedOrders} abandoned`,
      icon: Package,
    },
    {
      label: 'Total Order Value',
      value: formatCurrency(kpis.totalOrderValue, currency),
      hint: 'Contract amounts',
      icon: Scale,
    },
    {
      label: 'Payments Received',
      value: formatCurrency(kpis.totalPaymentsReceived, currency),
      hint: 'Cash collected',
      icon: Wallet,
    },
    {
      label: 'Outstanding Balance',
      value: formatCurrency(kpis.totalOutstandingBalance, currency),
      hint: 'Order value − payments',
      icon: CircleDollarSign,
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(kpis.totalExpenses, currency),
      hint: 'Operating + order costs',
      icon: Receipt,
    },
    {
      label: 'Contract Profit',
      value: formatCurrency(kpis.totalContractProfit, currency),
      hint: 'Order value − expenses',
      icon: TrendingUp,
    },
    {
      label: 'Cash Profit',
      value: formatCurrency(kpis.totalCashProfit, currency),
      hint: 'Payments − expenses',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title={`Welcome back, ${session.user.name?.split(' ')[0] ?? 'there'}`}
        description={`Totals below are converted to your base currency (${currency}). Individual orders never mix currencies.`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/orders/new">New order</Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link href="/payments/new">Add payment</Link>
            </Button>
          </div>
        }
      />

      <section className="surface-card space-y-3 p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Totals by currency</h2>
          <p className="text-sm text-muted-foreground">
            Native amounts grouped by currency — never added across currencies.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="py-2 pr-3">Currency</th>
                <th className="py-2 pr-3">Orders</th>
                <th className="py-2 pr-3">Order value</th>
                <th className="py-2 pr-3">Payments</th>
                <th className="py-2 pr-3">Outstanding</th>
                <th className="py-2 pr-3">Expenses</th>
                <th className="py-2 pr-3">Contract profit</th>
                <th className="py-2">Cash profit</th>
              </tr>
            </thead>
            <tbody>
              {(data.byCurrency ?? []).map((row) => (
                <tr key={row.currency} className="border-b border-border/60">
                  <td className="py-2.5 pr-3 font-medium">{row.currency}</td>
                  <td className="py-2.5 pr-3">{row.orderCount}</td>
                  <td className="py-2.5 pr-3">{formatCurrency(row.orderValue, row.currency)}</td>
                  <td className="py-2.5 pr-3">
                    {formatCurrency(row.paymentsReceived, row.currency)}
                  </td>
                  <td className="py-2.5 pr-3">
                    {formatCurrency(row.outstandingBalance, row.currency)}
                  </td>
                  <td className="py-2.5 pr-3">{formatCurrency(row.expenses, row.currency)}</td>
                  <td className="py-2.5 pr-3">
                    {formatCurrency(row.contractProfit, row.currency)}
                  </td>
                  <td className="py-2.5">{formatCurrency(row.cashProfit, row.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {card.label}
                </p>
                <span className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="font-display mt-3 truncate text-2xl font-semibold tracking-tight">
                {card.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{card.hint}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-semibold">This year ({data.yearly.year})</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Yearly revenue</p>
              <p className="font-display text-xl font-semibold">
                {formatCurrency(data.yearly.revenue, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Yearly expenses</p>
              <p className="font-display text-xl font-semibold">
                {formatCurrency(data.yearly.expenses, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Yearly contract profit</p>
              <p className="font-display text-xl font-semibold">
                {formatCurrency(data.yearly.contractProfit, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Yearly cash profit</p>
              <p className="font-display text-xl font-semibold">
                {formatCurrency(data.yearly.cashProfit, currency)}
              </p>
            </div>
          </div>
        </div>
        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-semibold">Monthly snapshot</h2>
          <p className="text-sm text-muted-foreground">
            Revenue = payments received in each month. Profits follow order-date contract/cash views.
          </p>
          <div className="mt-4 grid gap-2">
            {data.monthly.slice(-3).map((point) => (
              <div key={point.month} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{point.month}</span>
                <span className="font-medium">
                  Rev {formatCurrency(point.revenue, currency)} · Cash{' '}
                  {formatCurrency(point.cashProfit, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="surface-card p-5 xl:col-span-2">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">Monthly overview</h2>
            <p className="text-sm text-muted-foreground">Payments vs expenses over the last 6 months</p>
          </div>
          <RevenueExpenseChart data={data.monthly} />
        </div>
        <div className="surface-card p-5">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">Expense mix</h2>
            <p className="text-sm text-muted-foreground">By category</p>
          </div>
          <ExpenseBreakdownChart data={data.expenseBreakdown} />
          <div className="mt-3 space-y-2">
            {data.expenseBreakdown.slice(0, 4).map((row) => (
              <div key={row.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.name}</span>
                <span className="font-medium">{formatCurrency(row.amount, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="surface-card p-5 xl:col-span-2">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">Cash profit trend</h2>
            <p className="text-sm text-muted-foreground">Monthly cash profit after costs</p>
          </div>
          <ProfitBarChart data={data.monthly} />
        </div>

        <div className="surface-card p-5">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold">Business timeline</h2>
            <p className="text-sm text-muted-foreground">Latest activity</p>
          </div>
          <div className="space-y-3">
            {data.timeline.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <Badge variant="secondary" className="capitalize">
                    {item.type}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{item.subtitle}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDateDisplay(item.at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent orders</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/orders">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <Link
                key={order.id ?? order.orderNumber}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-3 hover:bg-muted/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{order.orderNumber}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.customerName} · {order.productName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(
                      'financials' in order && order.financials
                        ? order.financials.orderValue
                        : (order as { orderValue?: number }).orderValue ?? 0,
                      order.currency,
                    )}
                  </p>
                  <p className="text-[11px] capitalize text-muted-foreground">
                    {String(order.status).replace('_', ' ')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent customers</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/customers">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {data.recentCustomers.map((customer) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-3 hover:bg-muted/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{customer.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {customer.company || 'No company'} · {customer.country}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {formatDateDisplay(customer.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
