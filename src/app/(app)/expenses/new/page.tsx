import type { Metadata } from 'next';
import Link from 'next/link';

import { createExpenseAction } from '@/app/(app)/expenses/actions';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { ExpenseForm } from '@/components/shared/expenses/expense-form';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { DEFAULT_CURRENCY, type CurrencyCode } from '@/config/currency';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { ExpenseCategoryModel } from '@/models/expense-category.model';
import { OrderModel } from '@/models/order.model';
import { Types } from 'mongoose';

export const metadata: Metadata = {
  title: 'Add Expense',
};

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  await tryConnectMongoose();
  const useDemo = isDemoUserId(session.user.id);
  const raw = await Promise.resolve(searchParams);
  const orderIdParam = Array.isArray(raw.orderId) ? raw.orderId[0] : raw.orderId;

  const categories = useDemo
    ? demoStore.listCategories({}).items.map((c) => ({ id: c.id, label: c.name }))
    : (
        await ExpenseCategoryModel.find({ userId: new Types.ObjectId(session.user.id) }).lean()
      ).map((c) => ({ id: String(c._id), label: c.name as string }));

  const orders = useDemo
    ? demoStore.listPayments({}).orders.map((o) => ({
        id: o.id,
        label: o.label,
        currency: o.currency as CurrencyCode,
      }))
    : (
        await OrderModel.find({ userId: new Types.ObjectId(session.user.id) })
          .select('orderNumber productName currency')
          .lean()
      ).map((o) => ({
        id: String(o._id),
        label: `${o.orderNumber} — ${o.productName}`,
        currency: (o.currency as CurrencyCode) ?? DEFAULT_CURRENCY,
      }));

  const preselected = orders.find((o) => o.id === orderIdParam);

  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Workspace', href: '/dashboard' },
          { label: 'Expenses', href: '/expenses' },
          { label: 'Add' },
        ]}
      />
      {useDemo ? <DemoModeBanner /> : null}
      <PageHeader
        title="Add expense"
        description="Order-linked expenses stay in the order currency with no conversion."
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={orderIdParam ? `/orders/${orderIdParam}` : '/expenses'}>Back</Link>
          </Button>
        }
      />
      <ExpenseForm
        action={createExpenseAction}
        categories={categories}
        orders={orders}
        title="Expense details"
        description="If you link an order, currency is locked to that order."
        submitLabel="Save expense"
        defaultValues={{
          orderId: preselected?.id,
          currency: preselected?.currency ?? DEFAULT_CURRENCY,
        }}
        lockOrderId={Boolean(preselected)}
      />
    </div>
  );
}
