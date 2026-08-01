'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Types } from 'mongoose';

import { DEFAULT_CURRENCY, isCurrencyCode } from '@/config/currency';
import { isDemoUserId } from '@/lib/auth/demo';
import { getCurrentUserId } from '@/lib/auth/session';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import { expenseSchema } from '@/lib/validations/expense';
import { ExpenseModel } from '@/models/expense.model';
import { ExpenseCategoryModel } from '@/models/expense-category.model';
import { OrderModel } from '@/models/order.model';

async function ensureWritable(userId: string) {
  if (isDemoUserId(userId)) {
    const db = await tryConnectMongoose();
    if (!db) {
      return { ok: false as const, message: 'Demo mode is read-only until MongoDB is connected.' };
    }
  } else {
    const db = await tryConnectMongoose();
    if (!db) {
      return { ok: false as const, message: 'Database is unavailable. Please try again.' };
    }
  }
  return { ok: true as const };
}

function revalidateExpensePaths(orderId?: string | null) {
  revalidatePath('/expenses');
  revalidatePath('/dashboard');
  revalidatePath('/reports');
  if (orderId) {
    revalidatePath(`/orders/${orderId}`);
    revalidatePath(`/orders/${orderId}/statement`);
  }
}

export async function createExpenseAction(formData: FormData) {
  const userId = await getCurrentUserId();
  const writable = await ensureWritable(userId);
  if (!writable.ok) {
    return { error: writable.message };
  }

  const parsed = expenseSchema.safeParse({
    title: formData.get('title'),
    amount: formData.get('amount'),
    currency: formData.get('currency') || DEFAULT_CURRENCY,
    categoryId: formData.get('categoryId'),
    orderId: formData.get('orderId') || '',
    expenseDate: formData.get('expenseDate'),
    notes: formData.get('notes') || '',
  });

  if (!parsed.success) {
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const userObjectId = new Types.ObjectId(userId);
  const category = await ExpenseCategoryModel.findOne({
    _id: parsed.data.categoryId,
    userId: userObjectId,
  });
  if (!category) {
    return { error: 'Selected category was not found.' };
  }

  let orderId: Types.ObjectId | null = null;
  let currency = parsed.data.currency;
  if (parsed.data.orderId) {
    const order = await OrderModel.findOne({
      _id: parsed.data.orderId,
      userId: userObjectId,
    });
    if (!order) {
      return { error: 'Selected order was not found.' };
    }
    orderId = order._id as Types.ObjectId;
    // Order-linked expenses must stay in the order currency — no conversion.
    currency = isCurrencyCode(order.currency) ? order.currency : DEFAULT_CURRENCY;
  }

  await ExpenseModel.create({
    userId: userObjectId,
    categoryId: category._id,
    orderId,
    title: parsed.data.title,
    amount: parsed.data.amount,
    currency,
    expenseDate: new Date(parsed.data.expenseDate),
    notes: parsed.data.notes ?? '',
  });

  revalidateExpensePaths(orderId ? String(orderId) : null);
  redirect(orderId ? `/orders/${String(orderId)}?expense=created` : '/expenses?created=1');
}

export async function updateExpenseAction(expenseId: string, formData: FormData) {
  const userId = await getCurrentUserId();
  const writable = await ensureWritable(userId);
  if (!writable.ok) {
    return { error: writable.message };
  }

  const parsed = expenseSchema.safeParse({
    title: formData.get('title'),
    amount: formData.get('amount'),
    currency: formData.get('currency') || DEFAULT_CURRENCY,
    categoryId: formData.get('categoryId'),
    orderId: formData.get('orderId') || '',
    expenseDate: formData.get('expenseDate'),
    notes: formData.get('notes') || '',
  });

  if (!parsed.success) {
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const userObjectId = new Types.ObjectId(userId);
  const category = await ExpenseCategoryModel.findOne({
    _id: parsed.data.categoryId,
    userId: userObjectId,
  });
  if (!category) {
    return { error: 'Selected category was not found.' };
  }

  let orderId: Types.ObjectId | null = null;
  let currency = parsed.data.currency;
  if (parsed.data.orderId) {
    const order = await OrderModel.findOne({
      _id: parsed.data.orderId,
      userId: userObjectId,
    });
    if (!order) {
      return { error: 'Selected order was not found.' };
    }
    orderId = order._id as Types.ObjectId;
    currency = isCurrencyCode(order.currency) ? order.currency : DEFAULT_CURRENCY;
  }

  const updated = await ExpenseModel.findOneAndUpdate(
    { _id: expenseId, userId: userObjectId },
    {
      $set: {
        categoryId: category._id,
        orderId,
        title: parsed.data.title,
        amount: parsed.data.amount,
        currency,
        expenseDate: new Date(parsed.data.expenseDate),
        notes: parsed.data.notes ?? '',
      },
    },
    { new: true },
  );

  if (!updated) {
    return { error: 'Expense not found.' };
  }

  revalidateExpensePaths(orderId ? String(orderId) : null);
  redirect(orderId ? `/orders/${String(orderId)}?expense=updated` : '/expenses?updated=1');
}

export async function deleteExpenseAction(expenseId: string) {
  const userId = await getCurrentUserId();
  const writable = await ensureWritable(userId);
  if (!writable.ok) {
    return { error: writable.message };
  }

  const existing = (await ExpenseModel.findOne({
    _id: expenseId,
    userId: new Types.ObjectId(userId),
  }).lean()) as { orderId?: Types.ObjectId | null } | null;

  await ExpenseModel.deleteOne({
    _id: expenseId,
    userId: new Types.ObjectId(userId),
  });

  const orderId = existing?.orderId ? String(existing.orderId) : null;
  revalidateExpensePaths(orderId);
  redirect('/expenses?deleted=1');
}
