'use client';

import { useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { CurrencySelect } from '@/components/shared/currency-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_CURRENCY, type CurrencyCode } from '@/config/currency';
import { formatDateInput } from '@/lib/formatters';

type Option = { id: string; label: string };

type OrderOption = Option & { currency?: CurrencyCode | string };

type ExpenseFormProps = {
  action: (formData: FormData) => void | Promise<void> | Promise<unknown>;
  title: string;
  description: string;
  submitLabel: string;
  categories: Option[];
  orders: OrderOption[];
  defaultValues?: {
    title?: string;
    amount?: number;
    currency?: CurrencyCode | string;
    categoryId?: string;
    orderId?: string | null;
    expenseDate?: string | Date | null;
    notes?: string;
  };
  /** When true, order cannot be changed (e.g. editing from order context). */
  lockOrderId?: boolean;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="rounded-xl" disabled={pending}>
      {pending ? 'Saving...' : label}
    </Button>
  );
}

export function ExpenseForm({
  action,
  title,
  description,
  submitLabel,
  categories,
  orders,
  defaultValues,
  lockOrderId,
}: ExpenseFormProps) {
  const [orderId, setOrderId] = useState(defaultValues?.orderId ?? '');

  const linkedOrder = useMemo(
    () => orders.find((order) => order.id === orderId) ?? null,
    [orders, orderId],
  );

  const lockedCurrency = (linkedOrder?.currency as CurrencyCode | undefined) ?? null;
  const currencyDefault =
    lockedCurrency ??
    (defaultValues?.currency as CurrencyCode | undefined) ??
    DEFAULT_CURRENCY;

  async function handleAction(formData: FormData) {
    if (lockedCurrency) {
      formData.set('currency', lockedCurrency);
    }
    await action(formData);
  }

  return (
    <form action={handleAction} className="surface-card space-y-5 p-6">
      <div>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="e.g. Sea freight to Hamburg"
            defaultValue={defaultValues?.title ?? ''}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="0.00"
            defaultValue={defaultValues?.amount ?? ''}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          {lockedCurrency ? (
            <>
              <input type="hidden" name="currency" value={lockedCurrency} />
              <CurrencySelect
                id="currency"
                name="currencyDisplay"
                defaultValue={lockedCurrency}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Locked to the order currency ({lockedCurrency}). No conversion inside an order.
              </p>
            </>
          ) : (
            <CurrencySelect id="currency" name="currency" defaultValue={currencyDefault} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expenseDate">Expense date</Label>
          <Input
            id="expenseDate"
            name="expenseDate"
            type="date"
            required
            defaultValue={formatDateInput(defaultValues?.expenseDate)}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={defaultValues?.categoryId ?? ''}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="orderId">Linked order (optional)</Label>
          {lockOrderId ? (
            <>
              <input type="hidden" name="orderId" value={orderId} />
              <Input
                readOnly
                value={linkedOrder?.label ?? orderId}
                className="rounded-xl"
              />
            </>
          ) : (
            <select
              id="orderId"
              name="orderId"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">No linked order</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.label}
                  {order.currency ? ` (${order.currency})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Optional details"
            defaultValue={defaultValues?.notes ?? ''}
            className="min-h-24 rounded-xl"
          />
        </div>
      </div>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
