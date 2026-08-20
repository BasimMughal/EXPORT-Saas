import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { CategorySearch } from '@/components/shared/expense-categories/category-search';
import { CategoryTable } from '@/components/shared/expense-categories/category-table';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { formatDateDisplay } from '@/lib/formatters';
import { expenseCategoryFiltersSchema } from '@/lib/validations/expense-category';
import { ExpenseCategoryModel } from '@/models/expense-category.model';

export const metadata: Metadata = {
  title: 'Expense Categories',
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
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

  const db = await tryConnectMongoose();
  const useDemo = isDemoUserId(session.user.id);

  if (useDemo) {
    const result = demoStore.listCategories(params);
    const rows = result.items.map((category) => ({
      id: category.id,
      name: category.name,
      createdAt: formatDateDisplay(category.createdAt),
    }));

    return (
      <div className="animate-fade-up space-y-6">
        <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Categories' }]} />
        <DemoModeBanner />
        <PageHeader
          title="Expense Categories"
          description="Taxonomy for fabric, labour, shipping, customs, and more."
          actions={
            <Button asChild className="rounded-xl">
              <Link href="/expense-categories/new">Create Category</Link>
            </Button>
          }
        />
        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Category Library</CardTitle>
            <CardDescription>Demo categories used by sample expenses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CategorySearch q={params.q} />
            <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {result.total} categories in your account
            </div>
            <CategoryTable rows={rows} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="animate-fade-up space-y-6">
        <PageHeader title="Expense Categories" description="Database unavailable." />
        <DemoModeBanner />
      </div>
    );
  }

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
    id: String(category._id),
    name: category.name as string,
    createdAt: formatDateDisplay(category.createdAt as Date),
  }));

  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Categories' }]} />
      <PageHeader
        title="Expense Categories"
        description="Create your own category list. Nothing is hardcoded."
        actions={
          <Button asChild className="rounded-xl">
            <Link href="/expense-categories/new">Create Category</Link>
          </Button>
        }
      />
      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="font-display">Category Library</CardTitle>
          <CardDescription>
            Search categories like Printing, Shipping, Labour, Customs, or any custom expense name.
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
