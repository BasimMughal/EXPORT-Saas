'use client';

import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';

export function DeleteCategoryButton() {
  const { pending } = useFormStatus();

  return (
    <Button size="sm" type="submit" variant="destructive" disabled={pending}>
      {pending ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
