'use client';

import { useActionState, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

import { CurrencySelect } from '@/components/shared/currency-select';
import { OrderNumberChip } from '@/components/shared/orders/order-number-chip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  customerFieldErrors?: Partial<Record<keyof CustomerValues, string>>;
};

type CustomerOption = {
  id: string;
  label: string;
};

type OrderFormValues = {
  orderNumber?: string;
  customerId?: string;
  productName?: string;
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
  /** Rendered in the card header's top-right corner. */
  headerAction?: ReactNode;
};

const initialState: ActionState = {
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

export function OrderForm({
  title,
  description,
  submitLabel,
  action,
  customers,
  initialValues,
  headerAction,
}: OrderFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  // With no saved customers yet, start straight in "new customer" mode.
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialValues?.customerId ?? (customers.length ? '' : newCustomerValue),
  );
  const isNewCustomer = selectedCustomerId === newCustomerValue;
  // Editing: customer and order ID are shown as chips, and status is changed from the order
  // page's Actions menu, so those fields are only on the create form.
  const isEditing = Boolean(initialValues?.orderNumber);
  // On the edit screen, the order and its customer are shown as chips beside the title.
  const selectedCustomerLabel = customers.find(
    (customer) => customer.id === selectedCustomerId,
  )?.label;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{title}</CardTitle>
            {initialValues?.orderNumber && selectedCustomerLabel ? (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                {selectedCustomerLabel}
              </span>
            ) : null}
            {initialValues?.orderNumber ? (
              <OrderNumberChip orderNumber={initialValues.orderNumber} />
            ) : null}
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </CardHeader>
      <CardContent>
        <form className="space-y-5" action={formAction}>
          <div className="grid gap-5 md:grid-cols-3">
            {isEditing ? (
              <>
                <input type="hidden" name="customerId" value={selectedCustomerId} />
                <input type="hidden" name="customerMode" value="existing" />
              </>
            ) : (
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="customerId">Customer</Label>
                <select
                  id="customerId"
                  name="customerId"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                >
                  <option value="">Select a customer</option>
                  <option value={newCustomerValue}>+ New customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.label}
                    </option>
                  ))}
                </select>
                <input
                  type="hidden"
                  name="customerMode"
                  value={isNewCustomer ? 'new' : 'existing'}
                />
                {state.fieldErrors?.customerId ? (
                  <p className="text-sm text-destructive">{state.fieldErrors.customerId}</p>
                ) : null}
              </div>
            )}

            {isNewCustomer ? <NewCustomerFields errors={state.customerFieldErrors} /> : null}

            <div className="space-y-2">
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
                required
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

            {isEditing ? null : (
              <div className="space-y-2 md:col-span-3">
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
            )}
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
  );
}

const newCustomerFields: Array<{
  name: string;
  field: keyof CustomerValues;
  label: string;
  type?: string;
  required?: boolean;
}> = [
  { name: 'customerName', field: 'name', label: 'Customer name', required: true },
  { name: 'customerCountry', field: 'country', label: 'Country', required: true },
  { name: 'customerCompany', field: 'company', label: 'Company' },
  { name: 'customerPhone', field: 'phone', label: 'Phone' },
  { name: 'customerEmail', field: 'email', label: 'Email', type: 'email' },
];

function NewCustomerFields({ errors }: { errors?: Partial<Record<keyof CustomerValues, string>> }) {
  return (
    <div className="space-y-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 md:col-span-3">
      <div>
        <p className="text-sm font-medium">New customer details</p>
        <p className="text-xs text-muted-foreground">
          This customer is saved together with the order and will appear in Customers.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {newCustomerFields.map(({ name, field, label, type, required }) => (
          <div key={name} className="space-y-1.5">
            <Label htmlFor={name}>
              {label}
              {required ? <span className="text-destructive"> *</span> : null}
            </Label>
            <Input id={name} name={name} type={type ?? 'text'} required={required} />
            {errors?.[field] ? <p className="text-sm text-destructive">{errors[field]}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
