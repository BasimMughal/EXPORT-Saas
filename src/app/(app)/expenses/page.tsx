import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { ExpenseTable } from '@/components/shared/expenses/expense-table';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import {
  convertCurrency,
  DEFAULT_CURRENCY,
  isCurrencyCode,
} from '@/config/currency';
import { getPreferredCurrency } from '@/lib/currency/preferred';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { formatCurrency } from '@/lib/formatters';
import { expenseFiltersSchema } from '@/lib/validations/expense';
import { ExpenseModel } from '@/models/expense.model';
import { ExpenseCategoryModel } from '@/models/expense-category.model';
import { OrderModel } from '@/models/order.model';
import { Types } from 'mongoose';

export const metadata: Metadata = {
  title: 'Expenses',
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value ?? '';
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const raw = await Promise.resolve(searchParams);
  const params = expenseFiltersSchema.parse({
    q: firstParam(raw.q),
    categoryId: firstParam(raw.categoryId),
    orderId: firstParam(raw.orderId),
    from: firstParam(raw.from),
    to: firstParam(raw.to),
    sort: firstParam(raw.sort) || undefined,
    order: firstParam(raw.order) || undefined,
    page: firstParam(raw.page) || undefined,
    limit: firstParam(raw.limit) || undefined,
  });

  const flash = firstParam(raw.created)
    ? 'Expense created successfully.'
    : firstParam(raw.updated)
      ? 'Expense updated successfully.'
      : firstParam(raw.deleted)
        ? 'Expense deleted successfully.'
        : '';

  const db = await tryConnectMongoose();
  const useDemo = isDemoUserId(session.user.id);

  if (useDemo) {
    const result = demoStore.listExpenses(params);
    const categoryMap = new Map(result.categories.map((c) => [c.id, c.name]));
    const orderMap = new Map(result.orders.map((o) => [o.id, o.label.split(' — ')[0]]));
    const rows = result.items.map((item) => ({
      id: item.id,
      title: item.title,
      categoryName: categoryMap.get(item.categoryId) ?? '—',
      orderNumber: item.orderId ? orderMap.get(item.orderId) ?? '—' : '',
      amount: item.amount,
      currency: item.currency,
      expenseDate: item.expenseDate,
      notes: item.notes,
    }));

    return (
      <div className="animate-fade-up space-y-6">
        <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Expenses' }]} />
        <DemoModeBanner />
        <PageHeader
          title="Expenses"
          description="Track every cost against your export pipeline."
          actions={
            <Button asChild className="rounded-xl">
              <Link href="/expenses/new">Add expense</Link>
            </Button>
          }
        />
        <div className="surface-card p-4 text-sm text-muted-foreground">
          Total tracked:{' '}
          <span className="font-medium text-foreground">
            {formatCurrency(result.totalAmount, result.displayCurrency)}
          </span>
        </div>
        <ExpenseTable rows={rows} />
      </div>
    );
  }

  if (!db) {
    return (
      <div className="animate-fade-up space-y-6">
        <PageHeader title="Expenses" description="Database unavailable." />
        <DemoModeBanner />
      </div>
    );
  }

  const userObjectId = new Types.ObjectId(session.user.id);
  const query: Record<string, unknown> = { userId: userObjectId };
  if (params.categoryId) query.categoryId = new Types.ObjectId(params.categoryId);
  if (params.orderId) query.orderId = new Types.ObjectId(params.orderId);
  if (params.q) {
    query.$or = [
      { title: { $regex: params.q, $options: 'i' } },
      { notes: { $regex: params.q, $options: 'i' } },
    ];
  }

  const sortDirection = params.order === 'asc' ? 1 : -1;
  const expenses = await ExpenseModel.find(query)
    .sort({ [params.sort]: sortDirection })
    .skip((params.page - 1) * params.limit)
    .limit(params.limit)
    .lean();

  const preferred = await getPreferredCurrency(session.user.id);

  const [categories, orders, amountDocs] = await Promise.all([
    ExpenseCategoryModel.find({ userId: userObjectId }).lean(),
    OrderModel.find({ userId: userObjectId }).select('orderNumber productName').lean(),
    ExpenseModel.find({ userId: userObjectId }).select('amount currency').lean(),
  ]);

  const totalAmount = amountDocs.reduce((sum, expense) => {
    const currency = isCurrencyCode(expense.currency) ? expense.currency : DEFAULT_CURRENCY;
    return sum + convertCurrency(Number(expense.amount ?? 0), currency, preferred);
  }, 0);

  const categoryMap = new Map(categories.map((c) => [String(c._id), c.name as string]));
  const orderMap = new Map(orders.map((o) => [String(o._id), o.orderNumber as string]));

  const rows = expenses.map((expense) => ({
    id: String(expense._id),
    title: expense.title as string,
    categoryName: categoryMap.get(String(expense.categoryId)) ?? '—',
    orderNumber: expense.orderId ? orderMap.get(String(expense.orderId)) ?? '' : '',
    amount: expense.amount as number,
    currency: (expense.currency as string) ?? DEFAULT_CURRENCY,
    expenseDate: new Date(expense.expenseDate as Date).toISOString(),
    notes: (expense.notes as string) ?? '',
  }));

  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Expenses' }]} />
      <PageHeader
        title="Expenses"
        description="Track every cost against your export pipeline."
        actions={
          <Button asChild className="rounded-xl">
            <Link href="/expenses/new">Add expense</Link>
          </Button>
        }
      />
      {flash ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {flash}
        </div>
      ) : null}
      <div className="surface-card p-4 text-sm text-muted-foreground">
        Total tracked:{' '}
        <span className="font-medium text-foreground">
          {formatCurrency(totalAmount, preferred)}
        </span>
      </div>
      <ExpenseTable rows={rows} />
    </div>
  );
}
