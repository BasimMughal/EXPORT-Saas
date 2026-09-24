'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

import { deleteCustomerAction } from '@/app/(app)/customers/actions';
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

type DeleteCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  /** Customers with orders can't be deleted; the dialog explains why instead. */
  orderCount: number;
};

/** Confirmation dialog for deleting a customer. */
export function DeleteCustomerDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  orderCount,
}: DeleteCustomerDialogProps) {
  const [isDeleting, startDelete] = useTransition();
  const hasOrders = orderCount > 0;

  function confirmDelete() {
    startDelete(async () => {
      // Redirects to the customer list on success; returns a message when it can't delete.
      const result = await deleteCustomerAction(customerId);
      if (result && !result.ok) {
        toast.error(result.message);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isDeleting && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasOrders ? `${customerName} can't be deleted yet` : `Delete ${customerName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasOrders
              ? `This customer has ${orderCount} order${orderCount === 1 ? '' : 's'}. Delete those orders first, then you can remove the customer.`
              : "This customer will be permanently deleted. This can't be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl" disabled={isDeleting}>
            {hasOrders ? 'Close' : 'Cancel'}
          </AlertDialogCancel>
          {hasOrders ? null : (
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              {isDeleting ? 'Deleting...' : 'Delete customer'}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
