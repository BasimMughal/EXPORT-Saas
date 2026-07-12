'use client';

import { useTransition } from 'react';

import { deleteCustomerAction } from '@/app/(app)/customers/actions';
import { Button } from '@/components/ui/button';

type DeleteCustomerButtonProps = {
  customerId: string;
};

export function DeleteCustomerButton({ customerId }: DeleteCustomerButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      disabled={isPending}
      size="sm"
      type="button"
      variant="destructive"
      onClick={() => {
        startTransition(async () => {
          await deleteCustomerAction(customerId);
        });
      }}
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
