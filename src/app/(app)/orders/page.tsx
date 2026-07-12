import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { OrderFilters } from '@/components/shared/orders/order-filters';
import { OrderPagination } from '@/components/shared/orders/order-pagination';
import { OrderStats } from '@/components/shared/orders/order-stats';
import { OrderTable } from '@/components/shared/orders/order-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/db/mongoose';
import { formatDateDisplay } from '@/lib/formatters';
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
  receivedAmount: number;
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
    q: firstParam(rawSearchParams.q),
    status: firstParamOrUndefined(rawSearchParams.status),
    customerId: firstParam(rawSearchParams.customerId),
    sort: firstParamOrUndefined(rawSearchParams.sort),
    order: firstParamOrUndefined(rawSearchParams.order),
    page: firstParamOrUndefined(rawSearchParams.page),
    limit: firstParamOrUndefined(rawSearchParams.limit),
  });

  const params = parsedFilters.success ? parsedFilters.data : orderFiltersSchema.parse({});

  await connectMongoose();

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

  if (params.q) {
    query.$or = [
      { orderNumber: { $regex: params.q, $options: 'i' } },
      { productName: { $regex: params.q, $options: 'i' } },
      { description: { $regex: params.q, $options: 'i' } },
      { notes: { $regex: params.q, $options: 'i' } },
    ];
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

  const [orderStats, customerDocs] = await Promise.all([
    OrderModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalReceivedAmount: { $sum: '$receivedAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          inProgressOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          abandonedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] },
          },
        },
      },
    ]),
    CustomerModel.find({ userId: userObjectId }).select('name company').lean(),
  ]) as unknown as [
    Array<{
      totalOrders: number;
      totalReceivedAmount: number;
      pendingOrders: number;
      inProgressOrders: number;
      completedOrders: number;
      abandonedOrders: number;
    }>,
    CustomerLite[],
  ];

  const stats = orderStats[0] ?? {
    totalOrders: 0,
    totalReceivedAmount: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    abandonedOrders: 0,
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
    receivedAmount: order.receivedAmount,
    orderDate: formatDateDisplay(order.orderDate),
    deliveryDate: formatDateDisplay(order.deliveryDate),
    status: order.status,
    notes: order.notes ?? '',
  }));

  const queryString = new URLSearchParams(
    Object.entries({
      q: params.q,
      status: params.status,
      customerId: params.customerId,
      sort: params.sort,
      order: params.order,
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">Track every customer order with strong tenant isolation.</p>
        </div>
        <Button asChild>
          <Link href="/orders/new">Create Order</Link>
        </Button>
      </div>

      {flashMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          {flashMessage}
        </div>
      ) : null}

      <OrderStats
        abandonedOrders={stats.abandonedOrders}
        completedOrders={stats.completedOrders}
        inProgressOrders={stats.inProgressOrders}
        pendingOrders={stats.pendingOrders}
        totalOrders={stats.totalOrders}
        totalReceivedAmount={stats.totalReceivedAmount}
      />

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Order Directory</CardTitle>
          <CardDescription>Search, filter, sort, and manage orders from one place.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <OrderFilters
            customerId={params.customerId}
            customers={customerOptions}
            limit={params.limit}
            order={params.order}
            q={params.q}
            sort={params.sort}
            status={params.status}
          />

          <OrderTable rows={rows} />

          <OrderPagination page={params.page} queryString={queryString} totalPages={totalPages} />
        </CardContent>
      </Card>
    </div>
  );
}
