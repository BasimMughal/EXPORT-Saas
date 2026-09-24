import type { Metadata } from 'next';
import { Banknote, CircleDollarSign, Clock3, Package, TrendingUp } from 'lucide-react';

import { ProfitBarChart, RevenueExpenseChart } from '@/components/shared/dashboard/charts';
import { DashboardQuickMenu } from '@/components/shared/dashboard/dashboard-quick-menu';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCurrency, formatDateDisplay } from '@/lib/formatters';
import { getDashboardAnalytics } from '@/lib/services/analytics.service';
import { requireSession } from '@/lib/auth/session';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/domain';

export const metadata: Metadata = {
  title: 'Dashboard',
};

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-5 text-center">
      <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Clock3 className="h-4 w-4" />
      </span>
      <p className="text-sm font-medium text-foreground">Nothing here yet</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{message}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardAnalytics(session.user.id);
  const { kpis } = data;
  const currency = data.displayCurrency;
  const firstName = session.user.name?.split(' ')[0] ?? 'there';
  const collectionRate = kpis.totalOrderValue
    ? Math.max(0, Math.min(100, (kpis.totalPaymentsReceived / kpis.totalOrderValue) * 100))
    : 0;
  const completionRate = kpis.totalOrders
    ? Math.round((kpis.completedOrders / kpis.totalOrders) * 100)
    : 0;
  const contractMargin = kpis.totalOrderValue
    ? (kpis.totalContractProfit / kpis.totalOrderValue) * 100
    : 0;

  const primaryCards = [
    {
      label: 'Total order value',
      value: formatCurrency(kpis.totalOrderValue, currency),
      hint: `${kpis.totalOrders} orders in your pipeline`,
      icon: Package,
      iconClass: 'bg-blue-50 text-blue-600 ring-blue-100',
      barClass: 'bg-blue-500',
    },
    {
      label: 'Payments received',
      value: formatCurrency(kpis.totalPaymentsReceived, currency),
      hint: `${collectionRate.toFixed(0)}% of total order value`,
      icon: Banknote,
      iconClass: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      barClass: 'bg-emerald-500',
    },
    {
      label: 'Outstanding balance',
      value: formatCurrency(kpis.totalOutstandingBalance, currency),
      hint: 'Pending customer receivables',
      icon: CircleDollarSign,
      iconClass: 'bg-amber-50 text-amber-600 ring-amber-100',
      barClass: 'bg-amber-500',
    },
    {
      label: 'Cash profit',
      value: formatCurrency(kpis.totalCashProfit, currency),
      hint: `${contractMargin.toFixed(1)}% contract margin`,
      icon: TrendingUp,
      iconClass: 'bg-violet-50 text-violet-600 ring-violet-100',
      barClass: 'bg-violet-500',
    },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgb(16_185_129/0.12)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Live business overview
          </span>
        </div>
        <PageHeader
          title={`Welcome back, ${firstName}`}
          description={`Monitor orders, collections, expenses and profitability in ${currency} from one workspace.`}
          actions={
            <DashboardQuickMenu
              recentOrders={data.recentOrders.map((order) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                productName: order.productName,
                customerName: order.customerName,
                status: order.status as OrderStatus,
                orderValue: order.financials.orderValue,
                currency: order.currency,
                orderDate: order.orderDate,
              }))}
              recentCustomers={data.recentCustomers.map((customer) => ({
                id: customer.id,
                name: customer.name,
                company: customer.company,
                country: customer.country,
                createdAt: customer.createdAt,
              }))}
            />
          }
        />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="dashboard-card relative overflow-hidden">
              <span className={cn('absolute inset-x-0 top-0 h-0.5', card.barClass)} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                    <p className="font-display mt-2 truncate text-[1.65rem] font-semibold tracking-tight">
                      {card.value}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1',
                      card.iconClass,
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,0.75fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b p-5">
            <SectionTitle
              title="Revenue & expenses"
              description="Monthly cash movement for the last six months"
            />
            <Badge variant="outline" className="bg-background font-medium text-muted-foreground">
              {currency}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-5 sm:p-5">
            <RevenueExpenseChart data={data.monthly} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b p-5">
            <SectionTitle title="Pipeline health" description="Current operational progress" />
          </CardHeader>
          <CardContent className="space-y-6 p-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment collection</span>
                <span className="font-semibold">{collectionRate.toFixed(0)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Order completion</span>
                <span className="font-semibold">{completionRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t pt-5">
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-[11px] font-medium text-amber-700">Pending</p>
                <p className="font-display mt-1 text-2xl font-semibold text-amber-950">
                  {kpis.pendingOrders}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-[11px] font-medium text-blue-700">In progress</p>
                <p className="font-display mt-1 text-2xl font-semibold text-blue-950">
                  {kpis.inProgressOrders}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-[11px] font-medium text-emerald-700">Completed</p>
                <p className="font-display mt-1 text-2xl font-semibold text-emerald-950">
                  {kpis.completedOrders}
                </p>
              </div>
              <div className="rounded-lg bg-slate-100 p-3">
                <p className="text-[11px] font-medium text-slate-600">Customers</p>
                <p className="font-display mt-1 text-2xl font-semibold text-slate-950">
                  {kpis.totalCustomers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <Card>
          <CardHeader className="border-b p-5">
            <SectionTitle
              title="Cash profit trend"
              description="Monthly payments after recorded costs"
            />
          </CardHeader>
          <CardContent className="p-4 pt-5 sm:p-5">
            <ProfitBarChart data={data.monthly} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b p-5">
            <SectionTitle title="Latest activity" description="Orders, payments and expenses" />
          </CardHeader>
          <CardContent className="p-5">
            {data.timeline.length ? (
              <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
                {data.timeline.slice(0, 6).map((item) => (
                  <div key={item.id} className="relative flex gap-3 pl-0">
                    <span
                      className={cn(
                        'relative z-10 mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-card',
                        item.type === 'payment'
                          ? 'bg-emerald-500'
                          : item.type === 'expense'
                            ? 'bg-amber-500'
                            : 'bg-blue-500',
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </p>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                        {formatDateDisplay(item.at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBlock message="Your latest business activity will appear here." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
