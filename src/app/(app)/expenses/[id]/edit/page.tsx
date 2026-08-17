import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { updateExpenseAction } from '@/app/(app)/expenses/actions';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { ExpenseForm } from '@/components/shared/expenses/expense-form';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { DEFAULT_CURRENCY, type CurrencyCode } from '@/config/currency';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { ExpenseModel } from '@/models/expense.model';
import { ExpenseCategoryModel } from '@/models/expense-category.model';
import { OrderModel } from '@/models/order.model';

export const metadata: Metadata = {
  title: 'Edit Expense',
};

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await Promise.resolve(params);
  const useDemo = isDemoUserId(session.user.id);

  if (useDemo) {
    // Demo expenses are sample data only — no persistent edit without Mongo.
    return (
      <div className="animate-fade-up space-y-6">
        <DemoModeBanner />
        <PageHeader
          title="Edit expense"
          description="Connect MongoDB to edit expenses for this account."
          actions={
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/expenses">Back</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!Types.ObjectId.isValid(id)) notFound();
  const db = await tryConnectMongoose();
  if (!db) notFound();

  const userObjectId = new Types.ObjectId(session.user.id);
  const expense = (await ExpenseModel.findOne({
    _id: new Types.ObjectId(id),
    userId: userObjectId,
  }).lean()) as Record<string, unknown> | null;
  if (!expense) notFound();

  const [categories, orders] = await Promise.all([
    ExpenseCategoryModel.find({ userId: userObjectId }).lean(),
    OrderModel.find({ userId: userObjectId }).select('orderNumber productName currency').lean(),
  ]);

  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Workspace', href: '/dashboard' },
          { label: 'Expenses', href: '/expenses' },
          { label: 'Edit' },
        ]}
      />
      <PageHeader
        title="Edit expense"
        description="Order-linked expenses remain in the order currency."
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/expenses">Back</Link>
          </Button>
        }
      />
      <ExpenseForm
        action={updateExpenseAction.bind(null, id)}
        categories={categories.map((c) => ({ id: String(c._id), label: c.name as string }))}
        orders={orders.map((o) => ({
          id: String(o._id),
          label: `${o.orderNumber} — ${o.productName}`,
          currency: (o.currency as CurrencyCode) ?? DEFAULT_CURRENCY,
        }))}
        title="Expense details"
        description="Updating an order-linked expense keeps currency locked to that order."
        submitLabel="Save changes"
        defaultValues={{
          title: expense.title as string,
          amount: Number(expense.amount),
          currency: (expense.currency as string) ?? DEFAULT_CURRENCY,
          categoryId: String(expense.categoryId),
          orderId: expense.orderId ? String(expense.orderId) : '',
          expenseDate: new Date(expense.expenseDate as Date).toISOString(),
          notes: (expense.notes as string) ?? '',
        }}
      />
    </div>
  );
}
