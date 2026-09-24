'use client';

import { useId, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { CurrencySelect } from '@/components/shared/currency-select';
import { ExchangeRateField } from '@/components/shared/exchange-rate-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_CURRENCY, type CurrencyCode } from '@/config/currency';
import { toQuotedRate } from '@/lib/finance/currency-conversion';
import { formatDateInput } from '@/lib/formatters';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/lib/validations/payment';

type OrderOption = {
  id: string;
  label: string;
  currency?: CurrencyCode | string;
};

type PaymentFormProps = {
  action: (formData: FormData) => void | Promise<void> | Promise<unknown>;
  orders: OrderOption[];
  defaultValues?: {
    orderId?: string;
    amount?: number;
    paymentDate?: string | Date;
    method?: string;
    referenceNumber?: string;
    notes?: string;
    /** Set when the payment was received in another currency and converted. */
    originalAmount?: number | null;
    originalCurrency?: CurrencyCode | string | null;
    /** Stored-convention rate (see lib/finance/currency-conversion). */
    exchangeRate?: number | null;
  };
  lockOrderId?: boolean;
  submitLabel?: string;
  title?: string;
  /** `plain` drops the card chrome so the form can sit inside a dialog. */
  variant?: 'card' | 'plain';
  /** Shows a Cancel button next to submit. */
  onCancel?: () => void;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="rounded-xl" disabled={pending}>
      {pending ? 'Saving...' : label}
    </Button>
  );
}

export function PaymentForm({
  action,
  orders,
  defaultValues,
  lockOrderId,
  submitLabel = 'Save payment',
  title = 'Payment details',
  variant = 'card',
  onCancel,
}: PaymentFormProps) {
  // Unique ids so this form never clashes with another form on the same page.
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  const [orderId, setOrderId] = useState(defaultValues?.orderId ?? '');
  const orderCurrency =
    (orders.find((order) => order.id === orderId)?.currency as CurrencyCode | undefined) ?? null;

  // Amount and currency are what was actually received; for a converted payment that's the
  // original, not the stored order-currency amount.
  const [amount, setAmount] = useState(
    String(defaultValues?.originalAmount ?? defaultValues?.amount ?? ''),
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    () => (defaultValues?.originalCurrency ?? orderCurrency ?? DEFAULT_CURRENCY) as CurrencyCode,
  );
  const needsRate = orderCurrency !== null && currency !== orderCurrency;
  const savedRate =
    orderCurrency && defaultValues?.exchangeRate && defaultValues.originalCurrency === currency
      ? toQuotedRate(defaultValues.exchangeRate, orderCurrency, currency)
      : undefined;

  function handleOrderChange(nextOrderId: string) {
    setOrderId(nextOrderId);
    const nextOrder = orders.find((order) => order.id === nextOrderId);
    if (nextOrder?.currency) {
      setCurrency(nextOrder.currency as CurrencyCode);
    }
  }

  async function handleAction(formData: FormData) {
    await action(formData);
  }

  return (
    <form
      action={handleAction}
      className={variant === 'card' ? 'surface-card space-y-4 p-6' : 'space-y-4'}
    >
      {variant === 'card' ? (
        <div>
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            Record an installment or full payment against an order.
          </p>
        </div>
      ) : null}

      {/* A locked order is already named by the surrounding page or dialog, so no field is shown. */}
      {lockOrderId ? (
        <input type="hidden" name="orderId" value={orderId} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor={fieldId('orderId')}>Order</Label>
          <select
            id={fieldId('orderId')}
            name="orderId"
            required
            value={orderId}
            onChange={(event) => handleOrderChange(event.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">Select an order</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={fieldId('amount')}>Amount</Label>
          <Input
            id={fieldId('amount')}
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId('currency')}>Currency</Label>
          <CurrencySelect
            id={fieldId('currency')}
            name="currency"
            value={currency}
            onChange={setCurrency}
          />
        </div>

        {needsRate ? (
          <ExchangeRateField
            key={`${currency}-${orderCurrency}`}
            enteredCurrency={currency}
            orderCurrency={orderCurrency}
            amount={amount}
            defaultRate={savedRate}
          />
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={fieldId('paymentDate')}>Payment date</Label>
          <Input
            id={fieldId('paymentDate')}
            name="paymentDate"
            type="date"
            required
            defaultValue={formatDateInput(defaultValues?.paymentDate ?? new Date())}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId('method')}>Payment method</Label>
          <select
            id={fieldId('method')}
            name="method"
            required
            defaultValue={defaultValues?.method ?? 'bank_transfer'}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId('referenceNumber')}>Reference number</Label>
        <Input
          id={fieldId('referenceNumber')}
          name="referenceNumber"
          placeholder="Optional"
          defaultValue={defaultValues?.referenceNumber ?? ''}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId('notes')}>Notes</Label>
        <Textarea
          id={fieldId('notes')}
          name="notes"
          placeholder="Optional"
          defaultValue={defaultValues?.notes ?? ''}
          className="rounded-xl"
        />
      </div>

      <div className={onCancel ? 'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end' : ''}>
        {onCancel ? (
          <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
