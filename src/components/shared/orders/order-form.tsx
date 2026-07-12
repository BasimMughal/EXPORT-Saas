'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ORDER_STATUSES, type OrderValues } from '@/lib/validations/order';
import { formatDateInput } from '@/lib/formatters';

type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof OrderValues, string>>;
};

type CustomerOption = {
  id: string;
  label: string;
};

type OrderFormValues = {
  orderNumber?: string;
  customerId?: string;
  productName?: string;
  description?: string;
  quantity?: string;
  receivedAmount?: string;
  orderDate?: string;
  deliveryDate?: string;
  status?: string;
  notes?: string;
};

type OrderFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  customers: CustomerOption[];
  initialValues?: OrderFormValues;
};

const initialState: ActionState = {
  ok: false,
  message: '',
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? 'Saving...' : label}
    </Button>
  );
}

export function OrderForm({ title, description, submitLabel, action, customers, initialValues }: OrderFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" action={formAction}>
          {initialValues?.orderNumber ? (
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input id="orderNumber" value={initialValues.orderNumber} readOnly />
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customerId">Customer</Label>
              <select
                id="customerId"
                name="customerId"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue={initialValues?.customerId ?? ''}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.label}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.customerId ? (
                <p className="text-sm text-destructive">{state.fieldErrors.customerId}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input id="productName" name="productName" defaultValue={initialValues?.productName ?? ''} />
              {state.fieldErrors?.productName ? (
                <p className="text-sm text-destructive">{state.fieldErrors.productName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" min="1" defaultValue={initialValues?.quantity ?? '1'} />
              {state.fieldErrors?.quantity ? (
                <p className="text-sm text-destructive">{state.fieldErrors.quantity}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="receivedAmount">Received Amount</Label>
              <Input
                id="receivedAmount"
                name="receivedAmount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialValues?.receivedAmount ?? '0'}
              />
              {state.fieldErrors?.receivedAmount ? (
                <p className="text-sm text-destructive">{state.fieldErrors.receivedAmount}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderDate">Order Date</Label>
              <Input
                id="orderDate"
                name="orderDate"
                type="date"
                defaultValue={initialValues?.orderDate ?? formatDateInput(new Date())}
              />
              {state.fieldErrors?.orderDate ? (
                <p className="text-sm text-destructive">{state.fieldErrors.orderDate}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input id="deliveryDate" name="deliveryDate" type="date" defaultValue={initialValues?.deliveryDate ?? ''} />
              {state.fieldErrors?.deliveryDate ? (
                <p className="text-sm text-destructive">{state.fieldErrors.deliveryDate}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue={initialValues?.status ?? 'pending'}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status === 'in_progress'
                      ? 'In Progress'
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.status ? <p className="text-sm text-destructive">{state.fieldErrors.status}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={initialValues?.description ?? ''} />
            {state.fieldErrors?.description ? (
              <p className="text-sm text-destructive">{state.fieldErrors.description}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={initialValues?.notes ?? ''} />
            {state.fieldErrors?.notes ? <p className="text-sm text-destructive">{state.fieldErrors.notes}</p> : null}
          </div>

          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}

          <SubmitButton label={submitLabel} />
        </form>
      </CardContent>
    </Card>
  );
}
