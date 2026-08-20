import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Types } from 'mongoose';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { CustomerFilters } from '@/components/shared/customers/customer-filters';
import { CustomerPagination } from '@/components/shared/customers/customer-pagination';
import { CustomerTable } from '@/components/shared/customers/customer-table';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { formatDateDisplay } from '@/lib/formatters';
import { customerFiltersSchema } from '@/lib/validations/customer';
import { CustomerModel } from '@/models/customer.model';

export const metadata: Metadata = {
  title: 'Customers',
};

type SearchParams = Record<string, string | string[] | undefined>;
type CustomerListItem = {
  _id: Types.ObjectId;
  name: string;
  company?: string | null;
  country: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt: Date;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value ?? '';
}

function firstParamOrUndefined(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const rawSearchParams = await Promise.resolve(searchParams);
  const parsedFilters = customerFiltersSchema.safeParse({
    q: firstParam(rawSearchParams.q),
    country: firstParam(rawSearchParams.country),
    sort: firstParamOrUndefined(rawSearchParams.sort),
    order: firstParamOrUndefined(rawSearchParams.order),
    page: firstParamOrUndefined(rawSearchParams.page),
    limit: firstParamOrUndefined(rawSearchParams.limit),
  });
  const params = parsedFilters.success ? parsedFilters.data : customerFiltersSchema.parse({});

  const db = await tryConnectMongoose();
  const useDemo = isDemoUserId(session.user.id);

  if (useDemo) {
    const result = demoStore.listCustomers(params);
    const tableRows = result.items.map((customer) => ({
      id: customer.id,
      name: customer.name,
      company: customer.company,
      country: customer.country,
      phone: customer.phone,
      email: customer.email,
      notes: customer.notes,
      createdAt: formatDateDisplay(customer.createdAt),
    }));
    const queryString = new URLSearchParams(
      Object.entries({
        q: params.q,
        country: params.country,
        sort: params.sort,
        order: params.order,
        limit: String(params.limit),
      }).filter(([, value]) => value !== ''),
    ).toString();

    return (
      <div className="animate-fade-up space-y-6">
        <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Customers' }]} />
        <DemoModeBanner />
        <PageHeader
          title="Customers"
          description="Buyer directory with search, filters, and tenant isolation."
          actions={
            <Button asChild className="rounded-xl">
              <Link href="/customers/new">Create Customer</Link>
            </Button>
          }
        />
        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Customer Directory</CardTitle>
            <CardDescription>Sample garment export buyers for demo browsing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CustomerFilters
              q={params.q}
              country={params.country}
              sort={params.sort}
              order={params.order}
              limit={params.limit}
              countries={result.countries}
            />
            <CustomerTable rows={tableRows} />
            <CustomerPagination page={result.page} totalPages={result.totalPages} queryString={queryString} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="animate-fade-up space-y-6">
        <PageHeader title="Customers" description="Database unavailable." />
        <DemoModeBanner />
      </div>
    );
  }

  const query: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (params.country) query.country = params.country;
  if (params.q) {
    query.$or = [
      { name: { $regex: params.q, $options: 'i' } },
      { company: { $regex: params.q, $options: 'i' } },
      { country: { $regex: params.q, $options: 'i' } },
      { phone: { $regex: params.q, $options: 'i' } },
      { email: { $regex: params.q, $options: 'i' } },
      { notes: { $regex: params.q, $options: 'i' } },
    ];
  }

  const sortDirection = params.order === 'asc' ? 1 : -1;
  const sort = { [params.sort]: sortDirection } as Record<string, 1 | -1>;
  const skip = (params.page - 1) * params.limit;

  const totalCount = await CustomerModel.countDocuments(query);
  const customers = (await CustomerModel.find(query)
    .sort(sort)
    .skip(skip)
    .limit(params.limit)
    .lean()) as unknown as CustomerListItem[];

  const totalPages = Math.max(1, Math.ceil(totalCount / params.limit));
  if (params.page > totalPages && totalCount > 0) notFound();

  const countries = (await CustomerModel.distinct('country', { userId: session.user.id })) as string[];

  const tableRows = customers.map((customer) => ({
    id: customer._id.toString(),
    name: customer.name,
    company: customer.company ?? '',
    country: customer.country,
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    notes: customer.notes ?? '',
    createdAt: formatDateDisplay(customer.createdAt),
  }));

  const queryString = new URLSearchParams(
    Object.entries({
      q: params.q,
      country: params.country,
      sort: params.sort,
      order: params.order,
      limit: String(params.limit),
    }).filter(([, value]) => value !== ''),
  ).toString();

  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Customers' }]} />
      <PageHeader
        title="Customers"
        description="Buyer directory with search, filters, and tenant isolation."
        actions={
          <Button asChild className="rounded-xl">
            <Link href="/customers/new">Create Customer</Link>
          </Button>
        }
      />
      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="font-display">Customer Directory</CardTitle>
          <CardDescription>Search, filter, sort, and paginate through your own records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CustomerFilters
            q={params.q}
            country={params.country}
            sort={params.sort}
            order={params.order}
            limit={params.limit}
            countries={countries.sort()}
          />
          <CustomerTable rows={tableRows} />
          <CustomerPagination page={params.page} totalPages={totalPages} queryString={queryString} />
        </CardContent>
      </Card>
    </div>
  );
}
