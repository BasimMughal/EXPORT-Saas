import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';

import { updatePaymentAction } from '@/app/(app)/payments/actions';
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
import { PaymentModel } from '@/models/payment.model';

export const metadata: Metadata = {
  title: 'Edit Payment',
};

export default async function EditPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await Promise.resolve(params);
  const useDemo = isDemoUserId(session.user.id);

  if (useDemo) {
    const payment = demoStore.getPayment(id);
    if (!payment) notFound();
    const orders = demoStore.listPayments({}).orders.map((o) => ({ id: o.id, label: o.label }));
    return (
      <div className="animate-fade-up space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Workspace', href: '/dashboard' },
            { label: 'Payments', href: '/payments' },
            { label: 'Edit' },
          ]}
        />
        <DemoModeBanner />
        <PageHeader
          title="Edit payment"
          description="Update payment details. Totals recalculate automatically."
          actions={
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={`/orders/${payment.orderId}`}>Back to order</Link>
            </Button>
          }
        />
        <PaymentForm
          action={updatePaymentAction.bind(null, id)}
          orders={orders}
          defaultValues={payment}
          submitLabel="Save changes"
        />
      </div>
    );
  }

  if (!Types.ObjectId.isValid(id)) notFound();
  const db = await tryConnectMongoose();
  if (!db) notFound();

  const userObjectId = new Types.ObjectId(session.user.id);
  const payment = (await PaymentModel.findOne({
    _id: new Types.ObjectId(id),
    userId: userObjectId,
  }).lean()) as {
    _id: Types.ObjectId;
    orderId: Types.ObjectId;
    amount: number;
    paymentDate: Date;
    method: string;
    referenceNumber?: string;
    notes?: string;
  } | null;
  if (!payment) notFound();

  const orders = (
    await OrderModel.find({ userId: userObjectId }).select('orderNumber productName').lean()
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
          { label: 'Edit' },
        ]}
      />
      <PageHeader
        title="Edit payment"
        description="Update payment details. Totals recalculate automatically."
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/orders/${String(payment.orderId)}`}>Back to order</Link>
          </Button>
        }
      />
      <PaymentForm
        action={updatePaymentAction.bind(null, id)}
        orders={orders}
        defaultValues={{
          orderId: String(payment.orderId),
          amount: Number(payment.amount),
          paymentDate: new Date(payment.paymentDate as Date).toISOString(),
          method: String(payment.method),
          referenceNumber: (payment.referenceNumber as string) ?? '',
          notes: (payment.notes as string) ?? '',
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
