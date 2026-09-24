'use client';

import { useState } from 'react';
import { Banknote, ChevronDown, Plus, Receipt } from 'lucide-react';
import { toast } from 'sonner';

import { saveOrderExpenseAction } from '@/app/(app)/expenses/actions';
import { saveOrderPaymentAction } from '@/app/(app)/payments/actions';
import { ExpenseForm } from '@/components/shared/expenses/expense-form';
import { OrderNumberChip } from '@/components/shared/orders/order-number-chip';
import { PaymentForm } from '@/components/shared/payments/payment-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type OrderQuickAddMenuProps = {
  orderId: string;
  orderNumber: string;
  productName: string;
  currency: string;
  categories: Array<{ id: string; label: string }>;
};

type FormType = 'payment' | 'expense';

const FORM_COPY: Record<FormType, { title: string; description: string }> = {
  payment: {
    title: 'Add payment',
    description: 'Log an advance, installment or final settlement received from the customer.',
  },
  expense: {
    title: 'Add expense',
    description: 'Track a cost such as fabric, stitching, freight or packaging for this order.',
  },
};

/** "Add" dropdown that records a payment or an expense for the order in a dialog. */
export function OrderQuickAddMenu({
  orderId,
  orderNumber,
  productName,
  currency,
  categories,
}: OrderQuickAddMenuProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  // Kept after closing so the dialog doesn't change content during its exit animation.
  const [formType, setFormType] = useState<FormType>('payment');
  const orderOptions = [{ id: orderId, label: `${orderNumber} — ${productName}`, currency }];

  function openForm(type: FormType) {
    setFormType(type);
    setDialogOpen(true);
  }

  function closeForm() {
    setDialogOpen(false);
  }

  async function handleResult(result: { ok: boolean; message: string }) {
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    closeForm();
  }

  return (
    <>
      {/* Non-modal so the dialog opened from a menu item gets focus cleanly. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="rounded-xl">
            <Plus className="mr-1.5 h-4 w-4" />
            Add
            <ChevronDown className="ml-1.5 h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Add to this order</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => openForm('payment')}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Banknote className="h-4 w-4" />
            </span>
            <span>
              <span className="block font-medium">Add payment</span>
              <span className="block text-xs text-muted-foreground">Record money received</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openForm('expense')}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Receipt className="h-4 w-4" />
            </span>
            <span>
              <span className="block font-medium">Add expense</span>
              <span className="block text-xs text-muted-foreground">
                Record a cost for this order
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2.5 pr-6">
              <DialogTitle className="font-display">{FORM_COPY[formType].title}</DialogTitle>
              {/* Which order this is for, at a glance. */}
              <OrderNumberChip orderNumber={orderNumber} />
            </div>
            <DialogDescription>{FORM_COPY[formType].description}</DialogDescription>
          </DialogHeader>

          {formType === 'payment' ? (
            <PaymentForm
              variant="plain"
              action={async (formData) =>
                handleResult(await saveOrderPaymentAction(orderId, formData))
              }
              onCancel={closeForm}
              orders={orderOptions}
              lockOrderId
              defaultValues={{ orderId }}
              submitLabel="Add payment"
            />
          ) : null}

          {formType === 'expense' ? (
            <ExpenseForm
              variant="plain"
              action={async (formData) =>
                handleResult(await saveOrderExpenseAction(orderId, null, formData))
              }
              onCancel={closeForm}
              categories={categories}
              orders={orderOptions}
              lockOrderId
              defaultValues={{ orderId, currency, expenseDate: new Date() }}
              submitLabel="Add expense"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
