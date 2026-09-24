'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Types } from 'mongoose';

import { isDemoUserId } from '@/lib/auth/demo';
import { assertResourceOwnership } from '@/lib/auth/ownership';
import { getCurrentUserId } from '@/lib/auth/session';
import { demoStore } from '@/lib/demo/store';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from '@/config/currency';
import { convertToOrderCurrency } from '@/lib/finance/currency-conversion';
import { paymentSchema } from '@/lib/validations/payment';
import { OrderModel } from '@/models/order.model';
import { PaymentModel } from '@/models/payment.model';

async function ensureWritable(userId: string) {
  if (isDemoUserId(userId)) {
    // Demo store supports in-memory payment mutations without Mongo.
    return { ok: true as const, demo: true as const };
  }
  const db = await tryConnectMongoose();
  if (!db) {
    return { ok: false as const, message: 'Database is unavailable. Please try again.' };
  }
  return { ok: true as const, demo: false as const };
}

function revalidatePaymentPaths(orderId?: string) {
  revalidatePath('/payments');
  revalidatePath('/orders');
  revalidatePath('/dashboard');
  revalidatePath('/reports');
  if (orderId) {
    revalidatePath(`/orders/${orderId}`);
    revalidatePath(`/orders/${orderId}/statement`);
  }
}

async function verifyOrderOwnership(orderId: string, userId: string) {
  if (isDemoUserId(userId)) {
    const detail = demoStore.getOrder(orderId);
    return detail?.order ?? null;
  }

  const order = (await OrderModel.findOne({
    _id: new Types.ObjectId(orderId),
    userId: new Types.ObjectId(userId),
  }).lean()) as { currency?: string } | null;

  return order;
}

/**
 * Payments are always stored in their order's currency. One received in another currency is
 * converted at the rate the user entered; the original amount and rate are kept alongside.
 */
function toOrderCurrency(
  data: { amount: number; currency?: CurrencyCode; exchangeRate?: number },
  order: { currency?: unknown },
) {
  const orderCurrency = isCurrencyCode(order.currency) ? order.currency : DEFAULT_CURRENCY;
  return convertToOrderCurrency({
    amount: data.amount,
    enteredCurrency: data.currency ?? orderCurrency,
    orderCurrency,
    quotedRate: data.exchangeRate,
  });
}

function readPaymentForm(formData: FormData) {
  return {
    orderId: formData.get('orderId'),
    amount: formData.get('amount'),
    currency: formData.get('currency') || undefined,
    exchangeRate: formData.get('exchangeRate'),
    paymentDate: formData.get('paymentDate'),
    method: formData.get('method'),
    referenceNumber: formData.get('referenceNumber') || '',
    notes: formData.get('notes') || '',
  };
}

export async function createPaymentAction(formData: FormData) {
  const userId = await getCurrentUserId();
  const writable = await ensureWritable(userId);
  if (!writable.ok) {
    return { error: writable.message };
  }

  const parsed = paymentSchema.safeParse(readPaymentForm(formData));

  if (!parsed.success) {
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const order = await verifyOrderOwnership(parsed.data.orderId, userId);
  if (!order) {
    return { error: 'Selected order was not found.' };
  }

  const conversion = toOrderCurrency(parsed.data, order);
  if (!conversion.ok) {
    return { error: conversion.error };
  }

  if (writable.demo || isDemoUserId(userId)) {
    demoStore.createPayment({
      orderId: parsed.data.orderId,
      amount: conversion.value.amount,
      paymentDate: new Date(parsed.data.paymentDate).toISOString(),
      method: parsed.data.method,
      referenceNumber: parsed.data.referenceNumber ?? '',
      notes: parsed.data.notes ?? '',
    });
    revalidatePaymentPaths(parsed.data.orderId);
    redirect(`/orders/${parsed.data.orderId}?payment=created`);
  }

  await PaymentModel.create({
    userId: new Types.ObjectId(userId),
    orderId: new Types.ObjectId(parsed.data.orderId),
    ...conversion.value,
    paymentDate: parsed.data.paymentDate,
    method: parsed.data.method,
    referenceNumber: parsed.data.referenceNumber ?? '',
    notes: parsed.data.notes ?? '',
  });

  revalidatePaymentPaths(parsed.data.orderId);
  redirect(`/orders/${parsed.data.orderId}?payment=created`);
}

export async function updatePaymentAction(paymentId: string, formData: FormData) {
  const userId = await getCurrentUserId();
  const writable = await ensureWritable(userId);
  if (!writable.ok) {
    return { error: writable.message };
  }

  const parsed = paymentSchema.safeParse(readPaymentForm(formData));

  if (!parsed.success) {
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const order = await verifyOrderOwnership(parsed.data.orderId, userId);
  if (!order) {
    return { error: 'Selected order was not found.' };
  }

  const conversion = toOrderCurrency(parsed.data, order);
  if (!conversion.ok) {
    return { error: conversion.error };
  }

  if (isDemoUserId(userId)) {
    const existing = demoStore.getPayment(paymentId);
    if (!existing || existing.userId !== userId) {
      return { error: 'Payment not found.' };
    }
    assertResourceOwnership(existing.userId, userId);
    demoStore.updatePayment(paymentId, {
      orderId: parsed.data.orderId,
      amount: conversion.value.amount,
      paymentDate: new Date(parsed.data.paymentDate).toISOString(),
      method: parsed.data.method,
      referenceNumber: parsed.data.referenceNumber ?? '',
      notes: parsed.data.notes ?? '',
    });
    revalidatePaymentPaths(parsed.data.orderId);
    redirect(`/orders/${parsed.data.orderId}?payment=updated`);
  }

  const updated = await PaymentModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(paymentId),
      userId: new Types.ObjectId(userId),
    },
    {
      $set: {
        orderId: new Types.ObjectId(parsed.data.orderId),
        ...conversion.value,
        paymentDate: parsed.data.paymentDate,
        method: parsed.data.method,
        referenceNumber: parsed.data.referenceNumber ?? '',
        notes: parsed.data.notes ?? '',
      },
    },
    { new: true },
  );

  if (!updated) {
    return { error: 'Payment not found.' };
  }

  revalidatePaymentPaths(parsed.data.orderId);
  redirect(`/orders/${parsed.data.orderId}?payment=updated`);
}

export async function deletePaymentAction(paymentId: string, formData?: FormData) {
  const userId = await getCurrentUserId();
  const writable = await ensureWritable(userId);
  if (!writable.ok) {
    return { error: writable.message };
  }

  const returnOrderId = formData?.get('orderId')?.toString();

  if (isDemoUserId(userId)) {
    const existing = demoStore.getPayment(paymentId);
    if (!existing || existing.userId !== userId) {
      return { error: 'Payment not found.' };
    }
    assertResourceOwnership(existing.userId, userId);
    const orderId = existing.orderId;
    demoStore.deletePayment(paymentId);
    revalidatePaymentPaths(orderId);
    redirect(returnOrderId ? `/orders/${returnOrderId}?payment=deleted` : '/payments?deleted=1');
  }

  const existing = (await PaymentModel.findOne({
    _id: new Types.ObjectId(paymentId),
    userId: new Types.ObjectId(userId),
  }).lean()) as { userId: Types.ObjectId; orderId: Types.ObjectId } | null;

  if (!existing) {
    return { error: 'Payment not found.' };
  }

  assertResourceOwnership(String(existing.userId), userId);
  await PaymentModel.deleteOne({
    _id: new Types.ObjectId(paymentId),
    userId: new Types.ObjectId(userId),
  });

  const orderId = String(existing.orderId);
  revalidatePaymentPaths(orderId);
  redirect(returnOrderId ? `/orders/${returnOrderId}?payment=deleted` : '/payments?deleted=1');
}

export type OrderPaymentActionResult = {
  ok: boolean;
  message: string;
};

/** Deletes a payment from an order screen and returns a result instead of redirecting. */
export async function deleteOrderPaymentAction(
  orderId: string,
  paymentId: string,
): Promise<OrderPaymentActionResult> {
  const userId = await getCurrentUserId();
  const writable = await ensureWritable(userId);
  if (!writable.ok) {
    return { ok: false, message: writable.message };
  }

  if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(paymentId)) {
    return { ok: false, message: 'Payment not found.' };
  }

  const deleted = await PaymentModel.findOneAndDelete({
    _id: new Types.ObjectId(paymentId),
    orderId: new Types.ObjectId(orderId),
    userId: new Types.ObjectId(userId),
  });
  if (!deleted) {
    return { ok: false, message: 'Payment not found.' };
  }

  revalidatePaymentPaths(orderId);
  return { ok: true, message: 'Payment deleted.' };
}

/** Records a payment from an order screen and returns a result instead of redirecting. */
export async function saveOrderPaymentAction(
  orderId: string,
  formData: FormData,
): Promise<OrderPaymentActionResult> {
  const userId = await getCurrentUserId();
  const writable = await ensureWritable(userId);
  if (!writable.ok) {
    return { ok: false, message: writable.message };
  }

  // Payments added from an order screen always belong to that order.
  formData.set('orderId', orderId);
  const parsed = paymentSchema.safeParse(readPaymentForm(formData));
  if (!parsed.success) {
    const firstFieldError = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { ok: false, message: firstFieldError ?? 'Please check the payment details.' };
  }

  const order =
    writable.demo || Types.ObjectId.isValid(orderId)
      ? await verifyOrderOwnership(orderId, userId)
      : null;
  if (!order) {
    return { ok: false, message: 'Order not found.' };
  }

  const conversion = toOrderCurrency(parsed.data, order);
  if (!conversion.ok) {
    return { ok: false, message: conversion.error };
  }

  const payment = {
    amount: conversion.value.amount,
    method: parsed.data.method,
    referenceNumber: parsed.data.referenceNumber ?? '',
    notes: parsed.data.notes ?? '',
  };

  if (writable.demo) {
    demoStore.createPayment({
      orderId,
      paymentDate: new Date(parsed.data.paymentDate).toISOString(),
      ...payment,
    });
  } else {
    await PaymentModel.create({
      userId: new Types.ObjectId(userId),
      orderId: new Types.ObjectId(orderId),
      paymentDate: parsed.data.paymentDate,
      ...payment,
      ...conversion.value,
    });
  }

  revalidatePaymentPaths(orderId);
  return { ok: true, message: 'Payment recorded.' };
}
