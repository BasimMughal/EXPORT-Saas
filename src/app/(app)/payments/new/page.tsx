import type { Metadata } from 'next';
import Link from 'next/link';

import { createPaymentAction } from '@/app/(app)/payments/actions';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { DemoModeBanner } from '@/components/shared/demo-mode-banner';
import { PageHeader } from '@/components/shared/page-header';
import { PaymentForm } from '@/components/shared/payments/payment-form';
import { Button } from '@/components/ui/button';
import { isDemoUserId } from '@/lib/auth/demo';
import { requireSession } from '@/lib/auth/session';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { OrderModel } from '@/models/order.model';
import { Types } from 'mongoose';

export const metadata: Metadata = {
  title: 'Add Payment',
};

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const raw = await Promise.resolve(searchParams);
  const orderId = Array.isArray(raw.orderId) ? raw.orderId[0] : raw.orderId;
  const useDemo = isDemoUserId(session.user.id);

  const orders = useDemo
    ? demoStore.listPayments({}).orders.map((o) => ({ id: o.id, label: o.label }))
    : (
        await (async () => {
          await tryConnectMongoose();
          return OrderModel.find({ userId: new Types.ObjectId(session.user.id) })
            .select('orderNumber productName')
            .sort({ createdAt: -1 })
            .lean();
        })()
      ).map((o) => ({
        id: String(o._id),
        label: `${o.orderNumber} — ${o.productName}`,
      }));

  return (
    <div className="animate-fade-up space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Workspace', href: '/dashboard' },
          { label: 'Payments', href: '/payments' },
          { label: 'Add' },
        ]}
      />
      {useDemo ? <DemoModeBanner /> : null}
      <PageHeader
        title="Add payment"
        description="Record a single payment or installment against an order."
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={orderId ? `/orders/${orderId}` : '/payments'}>Back</Link>
          </Button>
        }
      />
      <PaymentForm
        action={createPaymentAction}
        orders={orders}
        defaultValues={{ orderId }}
        lockOrderId={Boolean(orderId)}
        submitLabel="Save payment"
      />
    </div>
  );
}
