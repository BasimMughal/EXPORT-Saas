'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { createExpenseCategoryForExpenseAction } from '@/app/(app)/expenses/actions';
import { CurrencySelect } from '@/components/shared/currency-select';
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
import { formatDateInput } from '@/lib/formatters';
import { type ExpenseCategoryValues } from '@/lib/validations/expense-category';

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
  returnTo?: string;
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
}: ExpenseFormProps) {
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

  const lockedCurrency = (linkedOrder?.currency as CurrencyCode | undefined) ?? null;
  const currencyDefault =
    lockedCurrency ?? (defaultValues?.currency as CurrencyCode | undefined) ?? DEFAULT_CURRENCY;

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
    if (lockedCurrency) {
      formData.set('currency', lockedCurrency);
    }
    await action(formData);
  }

  return (
    <>
      <form action={handleAction} className="surface-card space-y-5 p-6">
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
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

          <div className="space-y-2">
            <Label htmlFor="orderId">Linked order (optional)</Label>
            {lockOrderId ? (
              <>
                <input type="hidden" name="orderId" value={orderId} />
                <Input readOnly value={linkedOrder?.label ?? orderId} className="rounded-xl" />
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
