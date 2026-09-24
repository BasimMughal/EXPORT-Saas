'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';

import { DeleteCustomerDialog } from '@/components/shared/customers/delete-customer-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type CustomerActionsMenuProps = {
  customerId: string;
  customerName: string;
  orderCount: number;
};

/** "Actions" dropdown on the customer page: new order, edit and delete. */
export function CustomerActionsMenu({
  customerId,
  customerName,
  orderCount,
}: CustomerActionsMenuProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      {/* Non-modal so the delete dialog opened from a menu item gets focus cleanly. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="rounded-xl">
            Actions
            <ChevronDown className="ml-1.5 h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <Link href={`/orders/new?customerId=${customerId}`}>
              <Plus className="h-4 w-4 text-muted-foreground" />
              New order
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/customers/${customerId}/edit`}>
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Edit customer
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete customer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteCustomerDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        customerId={customerId}
        customerName={customerName}
        orderCount={orderCount}
      />
    </>
  );
}
