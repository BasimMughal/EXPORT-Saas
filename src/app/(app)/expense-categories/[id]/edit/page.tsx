import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { updateExpenseCategoryAction } from '@/app/(app)/expense-categories/actions';
import { CategoryForm } from '@/components/shared/expense-categories/category-form';
import { Button } from '@/components/ui/button';
import { requireSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/db/mongoose';
import { ExpenseCategoryModel } from '@/models/expense-category.model';

export const metadata: Metadata = {
  title: 'Edit Expense Category',
};

export default async function EditExpenseCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await Promise.resolve(params);

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectMongoose();

  const category = await ExpenseCategoryModel.findOne({
    _id: new Types.ObjectId(id),
    userId: new Types.ObjectId(session.user.id),
  }).lean();

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Edit Expense Category</h1>
          <p className="text-sm text-muted-foreground">Only you can modify your own categories.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/expense-categories">Back</Link>
        </Button>
      </div>

      <CategoryForm
        action={updateExpenseCategoryAction.bind(null, id)}
        description="Rename the category without affecting other users."
        initialValues={{
          name: String((category as { name?: string }).name ?? ''),
        }}
        submitLabel="Save Changes"
        title="Category Details"
      />
    </div>
  );
}
