import type { OrderFinancials } from '@/lib/finance/order-financials';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type Props = {
  financials: OrderFinancials;
  currency: string;
};

function profitTone(value: number) {
  if (value > 0) return 'text-emerald-600';
  if (value < 0) return 'text-rose-600';
  return 'text-foreground';
}

/**
 * Compact strip: collection progress plus outstanding, expenses and profit.
 * Lays itself out by its own width (container queries): one row when wide, two when narrow.
 */
export function OrderFinancialOverview({ financials, currency }: Props) {
  const {
    orderValue,
    totalPaymentsReceived: received,
    outstandingBalance: outstanding,
    totalExpenses,
    contractProfit,
    cashProfit,
  } = financials;

  const rawPercent = orderValue > 0 ? (received / orderValue) * 100 : received > 0 ? 100 : 0;
  const percent = Math.min(100, Math.round(rawPercent));
  const isSettled = orderValue > 0 && outstanding === 0;
  const isOverpaid = outstanding < 0;

  const status = isOverpaid
    ? { label: 'Overpaid', className: 'border-sky-200 bg-sky-50 text-sky-700' }
    : isSettled
      ? { label: 'Fully paid', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
      : received > 0
        ? { label: 'Partially paid', className: 'border-amber-200 bg-amber-50 text-amber-700' }
        : { label: 'Unpaid', className: 'border-border bg-muted/60 text-muted-foreground' };

  const stats = [
    {
      label: 'Outstanding',
      value: formatCurrency(Math.max(outstanding, 0), currency),
      hint: isOverpaid
        ? `${formatCurrency(Math.abs(outstanding), currency)} overpaid`
        : outstanding > 0
          ? 'Still to collect'
          : 'Fully settled',
      tone: isOverpaid ? 'text-sky-700' : outstanding > 0 ? 'text-amber-700' : 'text-emerald-600',
    },
    {
      label: 'Expenses',
      value: formatCurrency(totalExpenses, currency),
      hint: 'Linked to this order',
      tone: 'text-foreground',
    },
    {
      label: 'Contract profit',
      value: formatCurrency(contractProfit, currency),
      hint: 'Order value − expenses',
      tone: profitTone(contractProfit),
    },
    {
      label: 'Cash profit',
      value: formatCurrency(cashProfit, currency),
      hint: 'Received − expenses',
      tone: profitTone(cashProfit),
    },
  ];

  return (
    <section className="surface-card @container overflow-hidden">
      <dl className="grid grid-cols-2 gap-px bg-border/70 @xl:grid-cols-4 @5xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
        {/* Full-width row with the progress bar alongside; becomes a normal cell on very wide strips. */}
        <div className="col-span-2 bg-card px-4 py-4 @xl:col-span-4 @xl:px-5 @5xl:col-span-1">
          <div className="flex flex-col gap-3 @xl:flex-row @xl:items-center @xl:gap-8 @5xl:flex-col @5xl:items-stretch @5xl:gap-3">
            <div className="min-w-0 shrink-0">
              <div className="flex items-center gap-2">
                <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Collected
                </dt>
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                    status.className,
                  )}
                >
                  {status.label}
                </span>
              </div>
              <dd className="font-display mt-1 whitespace-nowrap text-2xl font-semibold tracking-tight">
                {formatCurrency(received, currency)}
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  of {formatCurrency(orderValue, currency)}
                </span>
              </dd>
            </div>
            <dd className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Payment collected"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-500',
                    isSettled || isOverpaid ? 'bg-emerald-500' : 'bg-primary',
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="shrink-0 text-sm font-medium text-muted-foreground">
                {percent}% collected
              </span>
            </dd>
          </div>
        </div>

        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0 bg-card px-4 py-4 @xl:px-5">
            <dt className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {stat.label}
            </dt>
            <dd className={cn('font-display mt-1 truncate text-lg font-semibold', stat.tone)}>
              {stat.value}
            </dd>
            <dd className="mt-0.5 text-xs text-muted-foreground">{stat.hint}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
