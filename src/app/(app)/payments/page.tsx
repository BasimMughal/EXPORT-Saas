import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { PageHeader } from '@/components/shared/page-header';
import { PaymentTable } from '@/components/shared/payments/payment-table';
import { Button } from '@/components/ui/button';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { formatCurrency } from '@/lib/formatters';
import { paymentFiltersSchema } from '@/lib/validations/payment';
import { CustomerModel } from '@/models/customer.model';
import { OrderModel } from '@/models/order.model';
import { PaymentModel } from '@/models/payment.model';
import { Types } from 'mongoose';

export const metadata: Metadata = {
  title: 'Payments',
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value ?? '';
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const raw = await Promise.resolve(searchParams);
  const params = paymentFiltersSchema.parse({
    q: firstParam(raw.q),
    orderId: firstParam(raw.orderId),
    method: firstParam(raw.method) || undefined,
    sort: firstParam(raw.sort) || undefined,
    order: firstParam(raw.order) || undefined,
    page: firstParam(raw.page) || undefined,
    limit: firstParam(raw.limit) || undefined,
  });

  const useDemo = isDemoUserId(session.user.id);

  if (useDemo) {
    const result = demoStore.listPayments(params);
    return (
      <div className="animate-fade-up space-y-6">
        <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Payments' }]} />
        <DemoModeBanner />
        <PageHeader
          title="Payments"
          description="Track advances, installments, and final settlements."
          actions={
            <Button asChild className="rounded-xl">
              <Link href="/payments/new">Add payment</Link>
            </Button>
          }
        />
        <PaymentTable rows={result.itemsEnriched} />
      </div>
    );
  }

  const db = await tryConnectMongoose();
  if (!db) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payments" description="Database unavailable." />
        <DemoModeBanner />
      </div>
    );
  }

  const userObjectId = new Types.ObjectId(session.user.id);
  const query: Record<string, unknown> = { userId: userObjectId };
  if (params.orderId) query.orderId = new Types.ObjectId(params.orderId);
  if (params.method) query.method = params.method;
  if (params.q) {
    query.$or = [
      { referenceNumber: { $regex: params.q, $options: 'i' } },
      { notes: { $regex: params.q, $options: 'i' } },
    ];
  }

  const payments = await PaymentModel.find(query)
    .sort({ [params.sort]: params.order === 'asc' ? 1 : -1 })
    .skip((params.page - 1) * params.limit)
    .limit(params.limit)
    .lean();

  const orderIds = [...new Set(payments.map((p) => String(p.orderId)))];
  const orders = await OrderModel.find({
    userId: userObjectId,
    _id: { $in: orderIds },
  }).lean();
  const customerIds = [...new Set(orders.map((o) => String(o.customerId)))];
  const customers = await CustomerModel.find({
    userId: userObjectId,
    _id: { $in: customerIds },
  }).lean();

  const orderMap = new Map(orders.map((o) => [String(o._id), o]));
  const customerMap = new Map(
    customers.map((c) => [String(c._id), ((c.company as string) || (c.name as string))]),
  );

  const rows = payments.map((payment) => {
    const order = orderMap.get(String(payment.orderId));
    return {
      id: String(payment._id),
      orderId: String(payment.orderId),
      orderNumber: (order?.orderNumber as string) ?? '',
      amount: Number(payment.amount),
      currency: String(order?.currency ?? 'PKR'),
      paymentDate: new Date(payment.paymentDate as Date).toISOString(),
      method: String(payment.method),
      referenceNumber: (payment.referenceNumber as string) ?? '',
      notes: (payment.notes as string) ?? '',
      customerName: order ? customerMap.get(String(order.customerId)) : '',
    };
  });

  const totalByCurrency = new Map<string, number>();
  for (const row of rows) {
    totalByCurrency.set(row.currency, (totalByCurrency.get(row.currency) ?? 0) + row.amount);
  }

  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs items={[{ label: 'Workspace', href: '/dashboard' }, { label: 'Payments' }]} />
      <PageHeader
        title="Payments"
        description="Track advances, installments, and final settlements."
        actions={
          <Button asChild className="rounded-xl">
            <Link href="/payments/new">Add payment</Link>
          </Button>
        }
      />
      <div className="surface-card space-y-2 p-4 text-sm text-muted-foreground">
        <p>Page totals by currency (never mixed):</p>
        <div className="flex flex-wrap gap-3">
          {[...totalByCurrency.entries()].map(([code, total]) => (
            <span key={code} className="font-medium text-foreground">
              {formatCurrency(total, code)}
            </span>
          ))}
          {totalByCurrency.size === 0 ? <span>—</span> : null}
        </div>
      </div>
      <PaymentTable rows={rows} />
    </div>
  );
}
