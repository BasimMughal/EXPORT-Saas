import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { OrderFilters } from '@/components/shared/orders/order-filters';
import { OrderPagination } from '@/components/shared/orders/order-pagination';
import { OrderStats } from '@/components/shared/orders/order-stats';
import { OrderTable } from '@/components/shared/orders/order-table';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { DEFAULT_CURRENCY, type CurrencyCode } from '@/config/currency';
import { formatCurrency } from '@/lib/formatters';
import { buildDateRangeFilter } from '@/lib/filters/date-range';
import { orderFiltersSchema } from '@/lib/validations/order';
import { CustomerModel } from '@/models/customer.model';
import { OrderModel } from '@/models/order.model';

export const metadata: Metadata = {
  title: 'Orders',
};

type SearchParams = Record<string, string | string[] | undefined>;

type OrderListItem = {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  orderNumber: string;
  productName: string;
  quantity: number;
  orderValue: number;
  currency?: CurrencyCode | string;
  orderDate: Date;
  deliveryDate: Date | null;
  status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
  notes?: string | null;
};

type CustomerOption = {
  id: string;
  label: string;
};

type CustomerLite = {
  _id: Types.ObjectId;
  name: string;
  company?: string | null;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? '';
}

function firstParamOrUndefined(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function hasObjectId(value: string) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const rawSearchParams = await Promise.resolve(searchParams);

  const parsedFilters = orderFiltersSchema.safeParse({
    status: firstParamOrUndefined(rawSearchParams.status),
    customerId: firstParam(rawSearchParams.customerId),
    from: firstParam(rawSearchParams.from),
    to: firstParam(rawSearchParams.to),
    page: firstParamOrUndefined(rawSearchParams.page),
    limit: firstParamOrUndefined(rawSearchParams.limit),
  });

  const params = parsedFilters.success ? parsedFilters.data : orderFiltersSchema.parse({});

  const db = await tryConnectMongoose();
  const useDemo = isDemoUserId(session.user.id);

  if (useDemo) {
    const result = demoStore.listOrders(params);
    const rows = result.items.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: result.customers.find((c) => c.id === order.customerId)?.label ?? 'Unknown',
      productName: order.productName,
      quantity: order.quantity,
      orderValue: order.orderValue,
      currency: order.currency,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate ?? '',
      status: order.status,
      notes: order.notes,
    }));
    const queryString = new URLSearchParams(
      Object.entries({
        status: params.status,
        customerId: params.customerId,
        from: params.from,
        to: params.to,
        limit: String(params.limit),
      }).filter(([, value]) => value !== ''),
    ).toString();

    return (
      <div className="animate-fade-up space-y-6">
        <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Orders' }]} />
        <DemoModeBanner />
        <PageHeader
          title="Orders"
          description="Track every customer order with strong tenant isolation."
          actions={
            <Button asChild className="rounded-xl">
              <Link href="/orders/new">Create Order</Link>
            </Button>
          }
        />
        <OrderStats {...result.stats} />
        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="font-display">Order pipeline</CardTitle>
              <CardDescription>
                Sample export orders · order value{' '}
                {formatCurrency(result.stats.totalOrderValue, result.displayCurrency)} · received{' '}
                {formatCurrency(result.stats.totalReceivedAmount, result.displayCurrency)}
              </CardDescription>
            </div>
            <OrderFilters
              status={params.status}
              customerId={params.customerId}
              from={params.from}
              to={params.to}
              limit={params.limit}
              customers={result.customers}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <OrderTable rows={rows} />
            <OrderPagination page={result.page} totalPages={result.totalPages} queryString={queryString} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="animate-fade-up space-y-6">
        <PageHeader title="Orders" description="Database unavailable." />
        <DemoModeBanner />
      </div>
    );
  }

  const userObjectId = new Types.ObjectId(session.user.id);
  const query: Record<string, unknown> = {
    userId: userObjectId,
  };

  if (params.status) {
    query.status = params.status;
  }

  if (params.customerId && hasObjectId(params.customerId)) {
    query.customerId = new Types.ObjectId(params.customerId);
  }

  const orderDateFilter = buildDateRangeFilter(params.from, params.to);
  if (orderDateFilter) {
    query.orderDate = orderDateFilter;
  }

  const sortDirection = params.order === 'asc' ? 1 : -1;
  const sort = { [params.sort]: sortDirection } as Record<string, 1 | -1>;
  const skip = (params.page - 1) * params.limit;

  const totalCount = await OrderModel.countDocuments(query);
  const orders = (await OrderModel.find(query).sort(sort).skip(skip).limit(params.limit).lean()) as unknown as OrderListItem[];

  const totalPages = Math.max(1, Math.ceil(totalCount / params.limit));

  if (params.page > totalPages && totalCount > 0) {
    notFound();
  }

  const [matchedOrders, customerDocs] = await Promise.all([
    OrderModel.find(query).select('_id status').lean(),
    CustomerModel.find({ userId: userObjectId }).select('name company').lean(),
  ]) as unknown as [
    Array<{
      _id: Types.ObjectId;
      status: OrderListItem['status'];
    }>,
    CustomerLite[],
  ];

  const stats = {
    totalOrders: matchedOrders.length,
    pendingOrders: matchedOrders.filter((o) => o.status === 'pending').length,
    inProgressOrders: matchedOrders.filter((o) => o.status === 'in_progress').length,
    completedOrders: matchedOrders.filter((o) => o.status === 'completed').length,
    abandonedOrders: matchedOrders.filter((o) => o.status === 'abandoned').length,
  };

  const customerOptions: CustomerOption[] = customerDocs.map((customer) => ({
    id: customer._id.toString(),
    label: customer.company ? `${customer.name} - ${customer.company}` : customer.name,
  }));

  const customerMap = new Map(
    customerDocs.map((customer) => [
      customer._id.toString(),
      customer.company ? `${customer.name} - ${customer.company}` : customer.name,
    ]),
  );

  const rows = orders.map((order) => ({
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    customerName: customerMap.get(order.customerId.toString()) ?? 'Unknown customer',
    productName: order.productName,
    quantity: order.quantity,
    orderValue: order.orderValue ?? (order as { receivedAmount?: number }).receivedAmount ?? 0,
    currency: order.currency ?? DEFAULT_CURRENCY,
    orderDate: order.orderDate instanceof Date ? order.orderDate.toISOString() : String(order.orderDate),
    deliveryDate: order.deliveryDate
      ? order.deliveryDate instanceof Date
        ? order.deliveryDate.toISOString()
        : String(order.deliveryDate)
      : '',
    status: order.status,
    notes: order.notes ?? '',
  }));

  const queryString = new URLSearchParams(
    Object.entries({
      status: params.status,
      customerId: params.customerId,
      from: params.from,
      to: params.to,
      limit: String(params.limit),
    }).filter(([, value]) => value !== ''),
  ).toString();

  const flashMessage = firstParam(rawSearchParams.created)
    ? 'Order created successfully.'
    : firstParam(rawSearchParams.updated)
      ? 'Order updated successfully.'
      : firstParam(rawSearchParams.deleted)
        ? 'Order deleted successfully.'
        : '';

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Track every customer order with strong tenant isolation.
          </p>
        </div>
        <Button asChild className="rounded-xl shadow-md shadow-primary/20">
          <Link href="/orders/new">Create Order</Link>
        </Button>
      </div>

      {flashMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {flashMessage}
        </div>
      ) : null}

      <OrderStats
        abandonedOrders={stats.abandonedOrders}
        completedOrders={stats.completedOrders}
        inProgressOrders={stats.inProgressOrders}
        pendingOrders={stats.pendingOrders}
        totalOrders={stats.totalOrders}
      />

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Order Directory</CardTitle>
            <CardDescription>Search, filter, sort, and manage orders from one place.</CardDescription>
          </div>
          <OrderFilters
            customerId={params.customerId}
            customers={customerOptions}
            from={params.from}
            limit={params.limit}
            status={params.status}
            to={params.to}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <OrderTable rows={rows} />

          <OrderPagination page={params.page} queryString={queryString} totalPages={totalPages} />
        </CardContent>
      </Card>
    </div>
  );
}
