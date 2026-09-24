'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Banknote, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteOrderPaymentAction } from '@/app/(app)/payments/actions';
import { EmptyState } from '@/components/shared/empty-state';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { isCurrencyCode } from '@/config/currency';
import { toQuotedRate } from '@/lib/finance/currency-conversion';
import { formatCurrency, formatDateDisplay } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/lib/validations/payment';

export type OrderPaymentRow = {
  id: string;
  amount: number;
  paymentDate: string;
  method: string;
  referenceNumber: string;
  notes: string;
  /** Present when the payment was received in another currency and converted. */
  originalAmount?: number | null;
  originalCurrency?: string | null;
  exchangeRate?: number | null;
};

type OrderPaymentsPanelProps = {
  orderId: string;
  currency: string;
  payments: OrderPaymentRow[];
  /** Layout classes from the parent, e.g. to let the card fill the remaining height. */
  className?: string;
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** "Rs 50,000 @ 278" for a converted payment; null otherwise. */
function originalAmountNote(payment: OrderPaymentRow, orderCurrency: string) {
  const { originalAmount, originalCurrency, exchangeRate } = payment;
  if (originalAmount == null || !exchangeRate || !isCurrencyCode(originalCurrency)) return null;
  if (!isCurrencyCode(orderCurrency)) return null;
  const rate = toQuotedRate(exchangeRate, orderCurrency, originalCurrency);
  return `${formatCurrency(originalAmount, originalCurrency)} @ ${rate.toLocaleString()}`;
}

function methodLabel(method: string) {
  return PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] ?? method;
}

export function OrderPaymentsPanel({
  orderId,
  currency,
  payments,
  className,
}: OrderPaymentsPanelProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OrderPaymentRow | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const newPaymentHref = `/payments/new?orderId=${orderId}`;
  const totalReceived = payments.reduce((sum, payment) => sum + payment.amount, 0);

  function openDelete(payment: OrderPaymentRow) {
    setDeleteTarget(payment);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    const paymentId = deleteTarget.id;
    startDelete(async () => {
      const result = await deleteOrderPaymentAction(orderId, paymentId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setDeleteOpen(false);
    });
  }

  return (
    <section className={cn('surface-card flex flex-col overflow-hidden', className)}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <Banknote className="h-[18px] w-[18px]" />
          </span>
          <h2 className="font-display truncate text-base font-semibold">
            Payments
            {payments.length ? (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 align-middle text-xs font-medium text-muted-foreground">
                {payments.length}
              </span>
            ) : null}
          </h2>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 rounded-lg">
          <Link href={newPaymentHref}>
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Record payment</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </Button>
      </div>

      {payments.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center overflow-auto p-5">
          <EmptyState
            title="No payments yet"
            description="Record advances and installments as they arrive to keep the outstanding balance accurate."
            action={
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={newPaymentHref}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Record first payment
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* Long installment histories scroll inside the card; headers and totals stay pinned.
              Capped on small screens, fills the remaining height on the xl single-screen layout. */}
          <div className="max-h-[26rem] overflow-auto xl:max-h-none xl:min-h-0 xl:flex-1">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_hsl(var(--border))] [&_tr]:border-b-0">
                <TableRow className="hover:bg-transparent [&>th]:h-10">
                  <TableHead className="hidden w-14 pl-5 sm:table-cell">#</TableHead>
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Method</TableHead>
                  <TableHead className="hidden md:table-cell">Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="pl-0 pr-4 text-right sm:pr-5">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment, index) => {
                  // Newest first, so the latest installment carries the highest number.
                  const installment = payments.length - index;
                  return (
                    <TableRow key={payment.id} className="[&>td]:py-3">
                      <TableCell className="hidden pl-5 font-mono text-xs text-muted-foreground sm:table-cell">
                        {installment}
                      </TableCell>
                      <TableCell className="whitespace-nowrap pl-4">
                        <p className="font-medium">{formatDateDisplay(payment.paymentDate)}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          #{installment} · {methodLabel(payment.method)}
                        </p>
                        {payment.notes ? (
                          <p className="max-w-xs truncate text-xs text-muted-foreground">
                            {payment.notes}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="whitespace-nowrap font-normal">
                          {methodLabel(payment.method)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden max-w-[180px] truncate font-mono text-xs text-muted-foreground md:table-cell">
                        {payment.referenceNumber || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-medium text-emerald-700">
                        {formatCurrency(payment.amount, currency)}
                        {originalAmountNote(payment, currency) ? (
                          <p className="text-xs font-normal text-muted-foreground">
                            {originalAmountNote(payment, currency)}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="pl-0 pr-4 sm:pr-5">
                        <div className="flex justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit payment"
                          >
                            <Link
                              href={`/payments/${payment.id}/edit`}
                              aria-label={`Edit payment of ${formatCurrency(payment.amount, currency)}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Delete payment of ${formatCurrency(payment.amount, currency)}`}
                            title="Delete payment"
                            onClick={() => openDelete(payment)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-muted/30 px-4 py-2.5 text-sm sm:px-5">
            <span className="text-muted-foreground">{plural(payments.length, 'installment')}</span>
            <span className="font-medium">
              Total received{' '}
              <span className="text-emerald-700">{formatCurrency(totalReceived, currency)}</span>
            </span>
          </div>
        </>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !isDeleting && setDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${formatCurrency(deleteTarget.amount, currency)} received on ${formatDateDisplay(deleteTarget.paymentDate)} via ${methodLabel(deleteTarget.method)} will be removed, and the outstanding balance will go up by the same amount. This can't be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              {isDeleting ? 'Deleting...' : 'Delete payment'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
