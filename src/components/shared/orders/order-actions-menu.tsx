'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ChevronDown, FileText, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { updateOrderStatusAction } from '@/app/(app)/orders/actions';
import { DeleteOrderDialog } from '@/components/shared/orders/delete-order-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/domain';

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string; dotClassName: string }> = [
  { value: 'pending', label: 'Pending', dotClassName: 'bg-amber-500' },
  { value: 'in_progress', label: 'In Progress', dotClassName: 'bg-sky-500' },
  { value: 'completed', label: 'Completed', dotClassName: 'bg-emerald-500' },
  { value: 'abandoned', label: 'Abandoned', dotClassName: 'bg-rose-500' },
];

type OrderActionsMenuProps = {
  orderId: string;
  status: OrderStatus;
  orderNumber: string;
  paymentCount: number;
  expenseCount: number;
};

/** "Actions" dropdown on the order page: edit, statement, status change and delete. */
export function OrderActionsMenu({
  orderId,
  status,
  orderNumber,
  paymentCount,
  expenseCount,
}: OrderActionsMenuProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isUpdatingStatus, startStatusUpdate] = useTransition();

  function changeStatus(nextStatus: string) {
    if (nextStatus === status) return;

    startStatusUpdate(async () => {
      const result = await updateOrderStatusAction(orderId, nextStatus);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      {/* Non-modal so the delete dialog opened from a menu item gets focus cleanly. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="rounded-xl" disabled={isUpdatingStatus}>
            {isUpdatingStatus ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                Actions
                <ChevronDown className="ml-1.5 h-4 w-4 text-muted-foreground" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Change status</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={status} onValueChange={changeStatus}>
            {STATUS_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <span className={cn('h-2 w-2 shrink-0 rounded-full', option.dotClassName)} />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/orders/${orderId}/edit`}>
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Edit order
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/orders/${orderId}/statement`}>
              <FileText className="h-4 w-4 text-muted-foreground" />
              View statement
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteOrderDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        orderId={orderId}
        orderNumber={orderNumber}
        paymentCount={paymentCount}
        expenseCount={expenseCount}
      />
    </>
  );
}
