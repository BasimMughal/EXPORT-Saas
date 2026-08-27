'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { createCustomerForOrderAction } from '@/app/(app)/orders/actions';
import { CurrencySelect } from '@/components/shared/currency-select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { type CustomerValues } from '@/lib/validations/customer';
import { ORDER_STATUSES, type OrderValues } from '@/lib/validations/order';
import { formatDateInput } from '@/lib/formatters';
import type { CurrencyCode } from '@/config/currency';

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
  orderValue?: string;
  currency?: CurrencyCode | string;
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

type CustomerCreateState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof CustomerValues, string>>;
  customer?: CustomerOption;
};

const initialCustomerState: CustomerCreateState = {
  ok: false,
  message: '',
};

const newCustomerValue = '__new_customer__';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? 'Saving...' : label}
    </Button>
  );
}

function CustomerSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="h-9 w-full rounded-lg sm:w-auto" type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create customer'}
    </Button>
  );
}

export function OrderForm({
  title,
  description,
  submitLabel,
  action,
  customers,
  initialValues,
}: OrderFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>(customers);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialValues?.customerId ?? '');
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerState, customerFormAction] = useActionState(
    createCustomerForOrderAction,
    initialCustomerState,
  );
  const customerFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setCustomerOptions(customers);
  }, [customers]);

  useEffect(() => {
    if (!customerState.ok || !customerState.customer) return;

    const newCustomer = customerState.customer;
    setCustomerOptions((current) => {
      const alreadyExists = current.some((customer) => customer.id === newCustomer.id);
      return alreadyExists ? current : [...current, newCustomer];
    });
    setSelectedCustomerId(newCustomer.id);
    setCustomerDialogOpen(false);
    customerFormRef.current?.reset();
  }, [customerState]);

  function handleCustomerChange(value: string) {
    if (value === newCustomerValue) {
      setCustomerDialogOpen(true);
      return;
    }

    setSelectedCustomerId(value);
  }

  return (
    <>
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
                  value={selectedCustomerId}
                  onChange={(event) => handleCustomerChange(event.target.value)}
                >
                  <option value="">Select a customer</option>
                  <option value={newCustomerValue}>+ New customer</option>
                  {customerOptions.map((customer) => (
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
                <Input
                  id="productName"
                  name="productName"
                  defaultValue={initialValues?.productName ?? ''}
                />
                {state.fieldErrors?.productName ? (
                  <p className="text-sm text-destructive">{state.fieldErrors.productName}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue={initialValues?.quantity ?? '1'}
                />
                {state.fieldErrors?.quantity ? (
                  <p className="text-sm text-destructive">{state.fieldErrors.quantity}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderValue">Order Value</Label>
                <Input
                  id="orderValue"
                  name="orderValue"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={initialValues?.orderValue ?? '0'}
                />
                <p className="text-xs text-muted-foreground">
                  Total contract amount. Payments are recorded separately.
                </p>
                {state.fieldErrors?.orderValue ? (
                  <p className="text-sm text-destructive">{state.fieldErrors.orderValue}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <CurrencySelect
                  id="currency"
                  name="currency"
                  defaultValue={(initialValues?.currency as CurrencyCode) ?? 'PKR'}
                  className="h-10 rounded-md"
                />
                <p className="text-xs text-muted-foreground">
                  All payments and order expenses stay in this currency. No conversion inside the
                  order.
                </p>
                {state.fieldErrors?.currency ? (
                  <p className="text-sm text-destructive">{state.fieldErrors.currency}</p>
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
                <Input
                  id="deliveryDate"
                  name="deliveryDate"
                  type="date"
                  defaultValue={initialValues?.deliveryDate ?? ''}
                />
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
                {state.fieldErrors?.status ? (
                  <p className="text-sm text-destructive">{state.fieldErrors.status}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={initialValues?.description ?? ''}
              />
              {state.fieldErrors?.description ? (
                <p className="text-sm text-destructive">{state.fieldErrors.description}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={initialValues?.notes ?? ''} />
              {state.fieldErrors?.notes ? (
                <p className="text-sm text-destructive">{state.fieldErrors.notes}</p>
              ) : null}
            </div>

            {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}

            <SubmitButton label={submitLabel} />
          </form>
        </CardContent>
      </Card>

      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl sm:max-w-[560px]">
          <DialogHeader className="border-b border-slate-200 px-5 py-4">
            <DialogTitle className="text-base">New customer</DialogTitle>
            <DialogDescription className="text-xs">
              Add customer details, then continue this order.
            </DialogDescription>
          </DialogHeader>

          <form ref={customerFormRef} action={customerFormAction}>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto px-5 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="quick-customer-name">
                    Name
                  </Label>
                  <Input
                    id="quick-customer-name"
                    name="name"
                    className="h-9 rounded-lg"
                    autoFocus
                  />
                  {customerState.fieldErrors?.name ? (
                    <p className="text-xs text-destructive">{customerState.fieldErrors.name}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="quick-customer-company">
                    Company
                  </Label>
                  <Input id="quick-customer-company" name="company" className="h-9 rounded-lg" />
                  {customerState.fieldErrors?.company ? (
                    <p className="text-xs text-destructive">{customerState.fieldErrors.company}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="quick-customer-country">
                    Country
                  </Label>
                  <Input id="quick-customer-country" name="country" className="h-9 rounded-lg" />
                  {customerState.fieldErrors?.country ? (
                    <p className="text-xs text-destructive">{customerState.fieldErrors.country}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="quick-customer-phone">
                    Phone
                  </Label>
                  <Input id="quick-customer-phone" name="phone" className="h-9 rounded-lg" />
                  {customerState.fieldErrors?.phone ? (
                    <p className="text-xs text-destructive">{customerState.fieldErrors.phone}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs" htmlFor="quick-customer-email">
                    Email
                  </Label>
                  <Input
                    id="quick-customer-email"
                    name="email"
                    type="email"
                    className="h-9 rounded-lg"
                  />
                  {customerState.fieldErrors?.email ? (
                    <p className="text-xs text-destructive">{customerState.fieldErrors.email}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="quick-customer-notes">
                  Notes
                </Label>
                <Textarea
                  id="quick-customer-notes"
                  name="notes"
                  className="min-h-20 rounded-lg"
                />
                {customerState.fieldErrors?.notes ? (
                  <p className="text-xs text-destructive">{customerState.fieldErrors.notes}</p>
                ) : null}
              </div>

              {!customerState.ok && customerState.message ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {customerState.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg bg-white"
                onClick={() => setCustomerDialogOpen(false)}
              >
                Cancel
              </Button>
              <CustomerSubmitButton />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
