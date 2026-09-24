'use client';

import { useActionState, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { createExpenseCategoryForExpenseAction } from '@/app/(app)/expenses/actions';
import { CurrencySelect } from '@/components/shared/currency-select';
import { ExchangeRateField } from '@/components/shared/exchange-rate-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_CURRENCY, type CurrencyCode } from '@/config/currency';
import { toQuotedRate } from '@/lib/finance/currency-conversion';
import { formatDateInput } from '@/lib/formatters';
import { type ExpenseCategoryValues } from '@/lib/validations/expense-category';

type Option = { id: string; label: string };

type OrderOption = Option & { currency?: CurrencyCode | string };

type ExpenseFormProps = {
  action: (formData: FormData) => void | Promise<void> | Promise<unknown>;
  title?: string;
  description?: string;
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
    /** Set when an order-linked expense was entered in another currency and converted. */
    originalAmount?: number | null;
    originalCurrency?: CurrencyCode | string | null;
    /** Stored-convention rate (see lib/finance/currency-conversion). */
    exchangeRate?: number | null;
  };
  /** When true, order cannot be changed (e.g. editing from order context). */
  lockOrderId?: boolean;
  returnTo?: string;
  /** `plain` drops the card chrome so the form can sit inside a dialog. */
  variant?: 'card' | 'plain';
  /** Shows a Cancel button next to submit. */
  onCancel?: () => void;
};

type CategoryCreateState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof ExpenseCategoryValues, string>>;
  category?: Option;
};

const initialCategoryState: CategoryCreateState = {
  ok: false,
  message: '',
};

const newCategoryValue = '__new_category__';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="rounded-xl" disabled={pending}>
      {pending ? 'Saving...' : label}
    </Button>
  );
}

function CategorySubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-9 rounded-lg" disabled={pending}>
      {pending ? 'Creating...' : 'Create category'}
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
  returnTo,
  variant = 'card',
  onCancel,
}: ExpenseFormProps) {
  // Unique ids so this form never clashes with another form on the same page.
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const [orderId, setOrderId] = useState(defaultValues?.orderId ?? '');
  const [categoryOptions, setCategoryOptions] = useState<Option[]>(categories);
  const [categoryId, setCategoryId] = useState(defaultValues?.categoryId ?? '');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryState, categoryFormAction] = useActionState(
    createExpenseCategoryForExpenseAction,
    initialCategoryState,
  );
  const categoryFormRef = useRef<HTMLFormElement>(null);

  const linkedOrder = useMemo(
    () => orders.find((order) => order.id === orderId) ?? null,
    [orders, orderId],
  );

  const orderCurrency = (linkedOrder?.currency as CurrencyCode | undefined) ?? null;

  // Amount and currency are what the user actually paid; for a converted expense that's the
  // original, not the stored order-currency amount.
  const [amount, setAmount] = useState(
    String(defaultValues?.originalAmount ?? defaultValues?.amount ?? ''),
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    () =>
      (defaultValues?.originalCurrency ??
        orders.find((order) => order.id === (defaultValues?.orderId ?? ''))?.currency ??
        defaultValues?.currency ??
        DEFAULT_CURRENCY) as CurrencyCode,
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

  useEffect(() => {
    setCategoryOptions(categories);
  }, [categories]);

  useEffect(() => {
    if (!categoryState.ok || !categoryState.category) return;

    const newCategory = categoryState.category;
    setCategoryOptions((current) => {
      const alreadyExists = current.some((category) => category.id === newCategory.id);
      return alreadyExists ? current : [...current, newCategory];
    });
    setCategoryId(newCategory.id);
    setCategoryDialogOpen(false);
    categoryFormRef.current?.reset();
  }, [categoryState]);

  function handleCategoryChange(value: string) {
    if (value === newCategoryValue) {
      setCategoryDialogOpen(true);
      return;
    }

    setCategoryId(value);
  }

  async function handleAction(formData: FormData) {
    await action(formData);
  }

  return (
    <>
      <form
        action={handleAction}
        className={variant === 'card' ? 'surface-card space-y-5 p-6' : 'space-y-5'}
      >
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
        {title || description ? (
          <div>
            {title ? <h2 className="font-display text-xl font-semibold">{title}</h2> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={fieldId('title')}>Title</Label>
            <Input
              id={fieldId('title')}
              name="title"
              required
              minLength={2}
              placeholder="e.g. Sea freight to Hamburg"
              defaultValue={defaultValues?.title ?? ''}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId('amount')}>Amount</Label>
            <Input
              id={fieldId('amount')}
              name="amount"
              type="number"
              min="0"
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
            <Label htmlFor={fieldId('expenseDate')}>Expense date</Label>
            <Input
              id={fieldId('expenseDate')}
              name="expenseDate"
              type="date"
              required
              defaultValue={formatDateInput(defaultValues?.expenseDate)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId('categoryId')}>Category</Label>
            <select
              id={fieldId('categoryId')}
              name="categoryId"
              required
              value={categoryId}
              onChange={(event) => handleCategoryChange(event.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Select category
              </option>
              <option value={newCategoryValue}>+ New category</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* A locked order is already named by the surrounding page or dialog, so no field is shown. */}
          {lockOrderId ? (
            <input type="hidden" name="orderId" value={orderId} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor={fieldId('orderId')}>Linked order (optional)</Label>
              <select
                id={fieldId('orderId')}
                name="orderId"
                value={orderId}
                onChange={(event) => handleOrderChange(event.target.value)}
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
            </div>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={fieldId('notes')}>Notes</Label>
            <Textarea
              id={fieldId('notes')}
              name="notes"
              placeholder="Optional details"
              defaultValue={defaultValues?.notes ?? ''}
              className="min-h-24 rounded-xl"
            />
          </div>
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

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl sm:max-w-[420px]">
          <DialogHeader className="border-b border-slate-200 px-5 py-4">
            <DialogTitle className="text-base">New expense category</DialogTitle>
            <DialogDescription className="text-xs">
              Create a category and continue adding this expense.
            </DialogDescription>
          </DialogHeader>

          <form ref={categoryFormRef} action={categoryFormAction}>
            <div className="space-y-2 px-5 py-4">
              <Label className="text-xs" htmlFor="quick-category-name">
                Category name
              </Label>
              <Input
                id="quick-category-name"
                name="name"
                placeholder="e.g. Clothing"
                className="h-9 rounded-lg"
                autoFocus
              />
              {categoryState.fieldErrors?.name ? (
                <p className="text-xs text-destructive">{categoryState.fieldErrors.name}</p>
              ) : null}
              {!categoryState.ok && categoryState.message ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {categoryState.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg bg-white"
                onClick={() => setCategoryDialogOpen(false)}
              >
                Cancel
              </Button>
              <CategorySubmitButton />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
