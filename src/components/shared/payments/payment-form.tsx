'use client';

import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDateInput } from '@/lib/formatters';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/lib/validations/payment';

type OrderOption = {
  id: string;
  label: string;
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
  };
  lockOrderId?: boolean;
  submitLabel?: string;
  title?: string;
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
}: PaymentFormProps) {
  async function handleAction(formData: FormData) {
    await action(formData);
  }

  return (
    <form action={handleAction} className="surface-card space-y-4 p-6">
      <div>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Record an installment or full payment against an order.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="orderId">Order</Label>
        {lockOrderId ? (
          <>
            <input type="hidden" name="orderId" value={defaultValues?.orderId ?? ''} />
            <Input
              readOnly
              value={orders.find((o) => o.id === defaultValues?.orderId)?.label ?? defaultValues?.orderId}
              className="rounded-xl"
            />
          </>
        ) : (
          <select
            id="orderId"
            name="orderId"
            required
            defaultValue={defaultValues?.orderId ?? ''}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">Select an order</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={defaultValues?.amount ?? ''}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentDate">Payment date</Label>
          <Input
            id="paymentDate"
            name="paymentDate"
            type="date"
            required
            defaultValue={formatDateInput(defaultValues?.paymentDate ?? new Date())}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="method">Payment method</Label>
          <select
            id="method"
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
        <div className="space-y-2">
          <Label htmlFor="referenceNumber">Reference number</Label>
          <Input
            id="referenceNumber"
            name="referenceNumber"
            placeholder="Optional"
            defaultValue={defaultValues?.referenceNumber ?? ''}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Optional"
          defaultValue={defaultValues?.notes ?? ''}
          className="rounded-xl"
        />
      </div>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
