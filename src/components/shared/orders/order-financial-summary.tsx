import { formatCurrency } from '@/lib/formatters';
import type { OrderFinancials } from '@/lib/finance/order-financials';

type Props = {
  financials: OrderFinancials;
  currency: string;
  compact?: boolean;
};

export function OrderFinancialSummary({ financials, currency, compact }: Props) {
  const items = [
    { label: 'Order value', value: financials.orderValue },
    { label: 'Payments received', value: financials.totalPaymentsReceived },
    { label: 'Outstanding balance', value: financials.outstandingBalance },
    { label: 'Total expenses', value: financials.totalExpenses },
    { label: 'Contract profit', value: financials.contractProfit },
    { label: 'Cash profit', value: financials.cashProfit },
  ];

  return (
    <div className={compact ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3'}>
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
          <p className="font-display mt-1 text-lg font-semibold">
            {formatCurrency(item.value, currency)}
          </p>
        </div>
      ))}
    </div>
  );
}
