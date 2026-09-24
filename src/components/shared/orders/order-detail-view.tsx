import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { FlashToast } from '@/components/shared/flash-toast';
import { OrderActionsMenu } from '@/components/shared/orders/order-actions-menu';
import { OrderFinancialOverview } from '@/components/shared/orders/order-financial-overview';
import {
  OrderPaymentsPanel,
  type OrderPaymentRow,
} from '@/components/shared/orders/order-payments-panel';
import { OrderStatusBadge } from '@/components/shared/orders/order-status-badge';
import type { OrderFinancials } from '@/lib/finance/order-financials';
import { formatDateDisplay, formatDateTimeDisplay } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/domain';

export type OrderDetailViewProps = {
  demo?: boolean;
  flash: string;
  order: {
    id: string;
    orderNumber: string;
    productName: string;
    quantity: number;
    status: OrderStatus;
    currency: string;
    orderDate: string;
    deliveryDate: string | null;
    notes: string;
    createdAt: string;
    updatedAt: string;
  };
  customer: {
    id: string;
    name: string;
    company: string;
    country: string;
  };
  financials: OrderFinancials;
  payments: OrderPaymentRow[];
  /** Expenses linked to the order; only the count is shown (in the delete confirmation). */
  expenseCount: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** Due-date hint for open orders, e.g. "Due in 3 days" or "2 days overdue". */
function getDeliveryHint(deliveryDate: string | null, status: OrderStatus) {
  if (!deliveryDate || status === 'completed' || status === 'abandoned') return null;

  const dueDay = Math.floor(new Date(deliveryDate).getTime() / DAY_MS);
  const today = Math.floor(Date.now() / DAY_MS);
  const days = dueDay - today;

  if (days < 0) {
    return {
      label: `${plural(-days, 'day')} overdue`,
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }
  if (days === 0) {
    return { label: 'Due today', className: 'border-amber-200 bg-amber-50 text-amber-700' };
  }
  return {
    label: `Due in ${plural(days, 'day')}`,
    className:
      days <= 7
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-border bg-card text-muted-foreground',
  };
}

function initialsOf(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </h2>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{children}</dd>
    </div>
  );
}

/**
 * Order page. On xl screens it fits the viewport: header and financial strip stay put,
 * the payments card takes the remaining height and scrolls internally. Smaller screens
 * stack everything and scroll normally.
 */
export function OrderDetailView({
  demo,
  flash,
  order,
  customer,
  financials,
  payments,
  expenseCount,
}: OrderDetailViewProps) {
  const customerDisplayName = customer.company || customer.name || 'Unknown customer';
  const deliveryHint = getDeliveryHint(order.deliveryDate, order.status);

  return (
    // 8rem = app header (4rem) + main's vertical padding on large screens (2 × 2rem).
    <div className="animate-fade-up flex flex-col gap-5 xl:h-[calc(100dvh-8rem)] xl:min-h-[560px]">
      <FlashToast message={flash} />

      <header className="shrink-0">
        <Breadcrumbs
          items={[
            { label: 'Workspace', href: '/dashboard' },
            { label: 'Orders', href: '/orders' },
            { label: order.orderNumber },
          ]}
        />
        {demo ? <DemoModeBanner /> : null}

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="font-display truncate text-2xl font-semibold tracking-tight text-foreground md:text-[1.75rem]">
                {order.productName}
              </h1>
              <OrderStatusBadge status={order.status} />
              {deliveryHint ? (
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                    deliveryHint.className,
                  )}
                >
                  {deliveryHint.label}
                </span>
              ) : null}
            </div>
            <p className="mt-1 break-words text-sm text-muted-foreground">{customerDisplayName}</p>
          </div>

          <div className="shrink-0">
            <OrderActionsMenu
              orderId={order.id}
              status={order.status}
              orderNumber={order.orderNumber}
              paymentCount={payments.length}
              expenseCount={expenseCount}
            />
          </div>
        </div>
      </header>

      <div className="grid gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-5 xl:min-h-0">
          <OrderFinancialOverview financials={financials} currency={order.currency} />
          <OrderPaymentsPanel
            orderId={order.id}
            currency={order.currency}
            payments={payments}
            className="xl:min-h-0 xl:flex-1"
          />
        </div>

        <aside className="surface-card flex flex-col overflow-hidden xl:min-h-0">
          <div className="flex-1 divide-y divide-border/70 overflow-y-auto">
            <section className="p-5">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle>Customer</SectionTitle>
                <Link
                  href={`/customers/${customer.id}`}
                  className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
                >
                  View profile
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  {initialsOf(customerDisplayName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{customerDisplayName}</p>
                  <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                    {customer.company && customer.name ? customer.name : null}
                    {customer.company && customer.name && customer.country ? (
                      <span className="text-border">•</span>
                    ) : null}
                    {customer.country ? (
                      <>
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {customer.country}
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            </section>

            <section className="p-5">
              <SectionTitle>Order details</SectionTitle>
              <dl className="mt-3 divide-y divide-border/60 text-sm">
                <DetailRow label="Product">{order.productName}</DetailRow>
                <DetailRow label="Quantity">{order.quantity.toLocaleString()}</DetailRow>
                <DetailRow label="Currency">{order.currency}</DetailRow>
                <DetailRow label="Order date">{formatDateDisplay(order.orderDate)}</DetailRow>
                <DetailRow label="Delivery date">{formatDateDisplay(order.deliveryDate)}</DetailRow>
              </dl>
            </section>

            {order.notes ? (
              <section className="p-5">
                <SectionTitle>Notes</SectionTitle>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                  {order.notes}
                </p>
              </section>
            ) : null}
          </div>

          <p className="shrink-0 border-t border-border/70 bg-muted/30 px-5 py-3 text-xs leading-5 text-muted-foreground">
            Created {formatDateTimeDisplay(order.createdAt)}
            <br />
            Updated {formatDateTimeDisplay(order.updatedAt)}
          </p>
        </aside>
      </div>
    </div>
  );
}
