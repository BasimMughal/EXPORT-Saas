import type { Metadata } from 'next';
import Link from 'next/link';

import { createExpenseCategoryAction } from '@/app/(app)/expense-categories/actions';
import { CategoryForm } from '@/components/shared/expense-categories/category-form';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Create Expense Category',
};

export default function NewExpenseCategoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Create Expense Category</h1>
          <p className="text-sm text-muted-foreground">Add a custom category for your own account.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/expense-categories">Back</Link>
        </Button>
      </div>

      <CategoryForm
        action={createExpenseCategoryAction}
        description="Examples are only guidance. Your categories are fully customizable."
        submitLabel="Create Category"
        title="Category Details"
      />
    </div>
  );
}
