'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Types } from 'mongoose';

import { DEFAULT_CURRENCY, isCurrencyCode } from '@/config/currency';
import { isDemoUserId } from '@/lib/auth/demo';
import { getCurrentUserId } from '@/lib/auth/session';
import { tryConnectMongoose } from '@/lib/db/mongoose';
import {
  expenseCategorySchema,
  type ExpenseCategoryValues,
} from '@/lib/validations/expense-category';
import {
  convertToOrderCurrency,
  type AmountInOrderCurrency,
} from '@/lib/finance/currency-conversion';
import { expenseSchema } from '@/lib/validations/expense';
import { ExpenseModel } from '@/models/expense.model';
import { ExpenseCategoryModel } from '@/models/expense-category.model';
import { OrderModel } from '@/models/order.model';

type CategoryQuickCreateState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof ExpenseCategoryValues, string>>;
  category?: {
    id: string;
    label: string;
  };
};

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
    revalidatePath(`/orders/${orderId}/edit`);
    revalidatePath(`/orders/${orderId}/statement`);
  }
}

function normalizeCategoryName(value: string) {
  return value.trim().toLowerCase();
}

function getSafeReturnTo(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return '';
  return value.startsWith('/') && !value.startsWith('//') ? value : '';
}

export async function createExpenseCategoryForExpenseAction(
  _: CategoryQuickCreateState,
  formData: FormData,
): Promise<CategoryQuickCreateState> {
  const userId = await getCurrentUserId();
  const writable = await ensureWritable(userId);
  if (!writable.ok) {
    return { ok: false, message: writable.message };
  }

  const parsed = expenseCategorySchema.safeParse({
    name: formData.get('name'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the highlighted category field.',
      fieldErrors: {
        name: parsed.error.flatten().fieldErrors.name?.[0],
      },
    };
  }

  const userObjectId = new Types.ObjectId(userId);
  const nameNormalized = normalizeCategoryName(parsed.data.name);
  const existing = (await ExpenseCategoryModel.findOne({
    userId: userObjectId,
    nameNormalized,
  }).lean()) as { _id: Types.ObjectId; name: string } | null;

  if (existing) {
    return {
      ok: true,
      message: 'Category selected.',
      category: {
        id: String(existing._id),
        label: existing.name as string,
      },
    };
  }

  const category = await ExpenseCategoryModel.create({
    userId: userObjectId,
    name: parsed.data.name,
    nameNormalized,
  });

  revalidatePath('/expense-categories');
  revalidatePath('/expenses');

  return {
    ok: true,
    message: 'Category created.',
    category: {
      id: category._id.toString(),
      label: category.name,
    },
  };
}

type SaveExpenseResult =
  | { ok: true; orderId: string | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

function readExpenseForm(formData: FormData) {
  return {
    title: formData.get('title'),
    amount: formData.get('amount'),
    currency: formData.get('currency') || DEFAULT_CURRENCY,
    categoryId: formData.get('categoryId'),
    orderId: formData.get('orderId') || '',
    exchangeRate: formData.get('exchangeRate'),
    expenseDate: formData.get('expenseDate'),
    notes: formData.get('notes') || '',
  };
}

/** Validates and saves an expense. Creates when `expenseId` is null, otherwise updates. */
async function saveExpense(
  userId: string,
  expenseId: string | null,
  formData: FormData,
): Promise<SaveExpenseResult> {
  const writable = await ensureWritable(userId);
  if (!writable.ok) {
    return { ok: false, error: writable.message };
  }

  const parsed = expenseSchema.safeParse(readExpenseForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const userObjectId = new Types.ObjectId(userId);
  const category = Types.ObjectId.isValid(parsed.data.categoryId)
    ? await ExpenseCategoryModel.findOne({ _id: parsed.data.categoryId, userId: userObjectId })
    : null;
  if (!category) {
    return { ok: false, error: 'Selected category was not found.' };
  }

  let orderId: Types.ObjectId | null = null;
  let converted: AmountInOrderCurrency = {
    amount: parsed.data.amount,
    originalAmount: null,
    originalCurrency: null,
    exchangeRate: null,
  };
  let currency = parsed.data.currency;
  if (parsed.data.orderId) {
    const order = Types.ObjectId.isValid(parsed.data.orderId)
      ? await OrderModel.findOne({ _id: parsed.data.orderId, userId: userObjectId })
      : null;
    if (!order) {
      return { ok: false, error: 'Selected order was not found.' };
    }
    orderId = order._id as Types.ObjectId;
    // Order-linked expenses are always stored in the order currency. One paid in another
    // currency is converted at the rate the user entered; the original is kept for reference.
    currency = isCurrencyCode(order.currency) ? order.currency : DEFAULT_CURRENCY;
    const conversion = convertToOrderCurrency({
      amount: parsed.data.amount,
      enteredCurrency: parsed.data.currency,
      orderCurrency: currency,
      quotedRate: parsed.data.exchangeRate,
    });
    if (!conversion.ok) {
      return { ok: false, error: conversion.error };
    }
    converted = conversion.value;
  }

  const fields = {
    categoryId: category._id,
    orderId,
    title: parsed.data.title,
    ...converted,
    currency,
    expenseDate: new Date(parsed.data.expenseDate),
    notes: parsed.data.notes ?? '',
  };

  if (expenseId) {
    const updated = Types.ObjectId.isValid(expenseId)
      ? await ExpenseModel.findOneAndUpdate(
          { _id: expenseId, userId: userObjectId },
          { $set: fields },
          { new: true },
        )
      : null;
    if (!updated) {
      return { ok: false, error: 'Expense not found.' };
    }
  } else {
    await ExpenseModel.create({ userId: userObjectId, ...fields });
  }

  const savedOrderId = orderId ? String(orderId) : null;
  revalidateExpensePaths(savedOrderId);
  return { ok: true, orderId: savedOrderId };
}

export async function createExpenseAction(formData: FormData) {
  const userId = await getCurrentUserId();
  const result = await saveExpense(userId, null, formData);
  if (!result.ok) {
    return { error: result.error, fieldErrors: result.fieldErrors };
  }

  const returnTo = getSafeReturnTo(formData.get('returnTo'));
  redirect(
    returnTo ||
      (result.orderId ? `/orders/${result.orderId}?expense=created` : '/expenses?created=1'),
  );
}

export async function updateExpenseAction(expenseId: string, formData: FormData) {
  const userId = await getCurrentUserId();
  const result = await saveExpense(userId, expenseId, formData);
  if (!result.ok) {
    return { error: result.error, fieldErrors: result.fieldErrors };
  }

  redirect(result.orderId ? `/orders/${result.orderId}?expense=updated` : '/expenses?updated=1');
}

export type OrderExpenseActionResult = {
  ok: boolean;
  message: string;
};

/**
 * Adds or edits an expense from an order screen. Returns a result instead of
 * redirecting so the order page can stay open and simply refresh its list.
 */
export async function saveOrderExpenseAction(
  orderId: string,
  expenseId: string | null,
  formData: FormData,
): Promise<OrderExpenseActionResult> {
  const userId = await getCurrentUserId();
  // Expenses saved from an order screen always stay linked to that order.
  formData.set('orderId', orderId);

  const result = await saveExpense(userId, expenseId, formData);
  if (!result.ok) {
    const firstFieldError = Object.values(result.fieldErrors ?? {}).flat()[0];
    return { ok: false, message: firstFieldError ?? result.error };
  }

  return { ok: true, message: expenseId ? 'Expense updated.' : 'Expense added.' };
}

export async function deleteOrderExpenseAction(
  orderId: string,
  expenseId: string,
): Promise<OrderExpenseActionResult> {
  const userId = await getCurrentUserId();
  const writable = await ensureWritable(userId);
  if (!writable.ok) {
    return { ok: false, message: writable.message };
  }

  if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(expenseId)) {
    return { ok: false, message: 'Expense not found.' };
  }

  const deleted = await ExpenseModel.findOneAndDelete({
    _id: new Types.ObjectId(expenseId),
    orderId: new Types.ObjectId(orderId),
    userId: new Types.ObjectId(userId),
  });
  if (!deleted) {
    return { ok: false, message: 'Expense not found.' };
  }

  revalidateExpensePaths(orderId);
  return { ok: true, message: 'Expense deleted.' };
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
