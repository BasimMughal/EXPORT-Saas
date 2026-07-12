import type { Metadata } from 'next';
import Link from 'next/link';

import { CategorySearch } from '@/components/shared/expense-categories/category-search';
import { CategoryTable } from '@/components/shared/expense-categories/category-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/db/mongoose';
import { expenseCategoryFiltersSchema } from '@/lib/validations/expense-category';
import { ExpenseCategoryModel } from '@/models/expense-category.model';

export const metadata: Metadata = {
  title: 'Expense Categories',
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? '';
}

export default async function ExpenseCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const rawSearchParams = await Promise.resolve(searchParams);
  const params = expenseCategoryFiltersSchema.parse({
    q: firstParam(rawSearchParams.q),
  });

  await connectMongoose();

  const query: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (params.q) {
    query.$or = [
      { name: { $regex: params.q, $options: 'i' } },
      { nameNormalized: { $regex: params.q.toLowerCase(), $options: 'i' } },
    ];
  }

  const totalCount = await ExpenseCategoryModel.countDocuments(query);
  const categories = await ExpenseCategoryModel.find(query).sort({ createdAt: -1 }).lean();

  const rows = categories.map((category) => ({
    id: category._id.toString(),
    name: category.name,
    createdAt: new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(category.createdAt),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Expense Categories</h1>
          <p className="text-sm text-muted-foreground">Create your own category list. Nothing is hardcoded.</p>
        </div>
        <Button asChild>
          <Link href="/expense-categories/new">Create Category</Link>
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Category Library</CardTitle>
          <CardDescription>
            Search categories like Printing, Shipping, Labour, Customs, or any custom expense name you need.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CategorySearch q={params.q} />
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'category' : 'categories'} in your account
          </div>
          <CategoryTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
