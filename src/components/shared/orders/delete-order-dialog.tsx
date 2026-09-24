'use client';

import { useTransition } from 'react';

import { deleteOrderAction } from '@/app/(app)/orders/actions';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type DeleteOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  paymentCount: number;
  expenseCount: number;
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** Confirmation dialog for deleting an order; spells out what else is affected. */
export function DeleteOrderDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  paymentCount,
  expenseCount,
}: DeleteOrderDialogProps) {
  const [isDeleting, startDelete] = useTransition();

  function confirmDelete() {
    startDelete(async () => {
      // Redirects to the orders list once the order is gone.
      await deleteOrderAction(orderId, new FormData());
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isDeleting && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete order {orderNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            This order will be permanently deleted. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {paymentCount > 0 || expenseCount > 0 ? (
          <ul className="space-y-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            {paymentCount > 0 ? (
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                <span>
                  <span className="font-medium">{plural(paymentCount, 'payment')}</span> recorded
                  against this order will also be deleted.
                </span>
              </li>
            ) : null}
            {expenseCount > 0 ? (
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                <span>
                  <span className="font-medium">{plural(expenseCount, 'expense')}</span> will be
                  kept, but no longer linked to any order.
                </span>
              </li>
            ) : null}
          </ul>
        ) : null}

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
            {isDeleting ? 'Deleting...' : 'Delete order'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
