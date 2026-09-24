'use client';

import { useId, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CurrencyCode } from '@/config/currency';
import { convertToOrderCurrency, getRateQuote } from '@/lib/finance/currency-conversion';
import { formatCurrency } from '@/lib/formatters';

type ExchangeRateFieldProps = {
  /** Currency the amount is being entered in. */
  enteredCurrency: CurrencyCode;
  orderCurrency: CurrencyCode;
  /** Current value of the amount input, for the live preview. */
  amount: string;
  /** Rate to prefill, already in the "1 base = ? quote" direction. */
  defaultRate?: number;
};

/**
 * Asks for the exchange rate when an amount is entered in a currency other than the order's,
 * and previews what will be saved to the order. Submits `exchangeRate` exactly as typed;
 * the server does the conversion.
 */
export function ExchangeRateField({
  enteredCurrency,
  orderCurrency,
  amount,
  defaultRate,
}: ExchangeRateFieldProps) {
  const id = useId();
  const [rate, setRate] = useState(defaultRate ? String(defaultRate) : '');
  const { base, quote } = getRateQuote(orderCurrency, enteredCurrency);

  const numericAmount = Number(amount);
  const preview =
    amount !== '' && numericAmount > 0
      ? convertToOrderCurrency({
          amount: numericAmount,
          enteredCurrency,
          orderCurrency,
          quotedRate: rate === '' ? null : Number(rate),
        })
      : null;

  return (
    <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4 md:col-span-2">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
        Exchange rate
      </Label>
      <div className="flex items-center gap-2 text-sm">
        <span className="whitespace-nowrap font-medium">1 {base} =</span>
        <Input
          id={id}
          name="exchangeRate"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          required
          placeholder="Rate you received"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
          className="max-w-44 rounded-lg bg-background"
        />
        <span className="font-medium">{quote}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {preview?.ok ? (
          <>
            {formatCurrency(numericAmount, enteredCurrency)} ={' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(preview.value.amount, orderCurrency)}
            </span>{' '}
            will be added to this order.
          </>
        ) : (
          `Enter the rate from your bank or exchange. The amount is saved to this order in ${orderCurrency}.`
        )}
      </p>
    </div>
  );
}
