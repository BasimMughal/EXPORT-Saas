'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Types } from 'mongoose';

import { requireSession } from '@/lib/auth/session';
import { getErrorMessage } from '@/lib/errors';
import { connectMongoose } from '@/lib/db/mongoose';
import { expenseCategorySchema, type ExpenseCategoryValues } from '@/lib/validations/expense-category';
import { ExpenseCategoryModel } from '@/models/expense-category.model';

type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof ExpenseCategoryValues, string>>;
};

const initialState: ActionState = {
  ok: false,
  message: '',
};

function parseFormData(formData: FormData) {
  return {
    name: formData.get('name'),
  };
}

function buildFieldErrors(errors: Record<string, string[] | undefined>) {
  return {
    name: errors.name?.[0],
  };
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export async function createExpenseCategoryAction(
  _: ActionState = initialState,
  formData: FormData,
) {
  try {
    const session = await requireSession();
    const parsed = expenseCategorySchema.safeParse(parseFormData(formData));

    if (!parsed.success) {
      return {
        ok: false,
        message: 'Please fix the highlighted fields.',
        fieldErrors: buildFieldErrors(parsed.error.flatten().fieldErrors),
      };
    }

    await connectMongoose();

    await ExpenseCategoryModel.create({
      userId: new Types.ObjectId(session.user.id),
      name: parsed.data.name,
      nameNormalized: normalizeName(parsed.data.name),
    });

    revalidatePath('/expense-categories');
    redirect('/expense-categories?created=1');
  } catch (error) {
    const isDuplicate = (error as { code?: number }).code === 11000;
    if (isDuplicate) {
      return {
        ok: false,
        message: 'This category already exists for your account.',
        fieldErrors: {
          name: 'This category already exists for your account.',
        },
      };
    }

    return {
      ok: false,
      message: getErrorMessage(error, 'Unable to create category right now.'),
    };
  }
}

export async function updateExpenseCategoryAction(
  categoryId: string,
  _: ActionState = initialState,
  formData: FormData,
) {
  try {
    const session = await requireSession();
    const parsed = expenseCategorySchema.safeParse(parseFormData(formData));

    if (!parsed.success) {
      return {
        ok: false,
        message: 'Please fix the highlighted fields.',
        fieldErrors: buildFieldErrors(parsed.error.flatten().fieldErrors),
      };
    }

    await connectMongoose();

    const updated = await ExpenseCategoryModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(categoryId),
        userId: new Types.ObjectId(session.user.id),
      },
      {
        $set: {
          name: parsed.data.name,
          nameNormalized: normalizeName(parsed.data.name),
        },
      },
      { new: true },
    );

    if (!updated) {
      return {
        ok: false,
        message: 'Category not found.',
      };
    }

    revalidatePath('/expense-categories');
    redirect('/expense-categories?updated=1');
  } catch (error) {
    const isDuplicate = (error as { code?: number }).code === 11000;
    if (isDuplicate) {
      return {
        ok: false,
        message: 'This category already exists for your account.',
        fieldErrors: {
          name: 'This category already exists for your account.',
        },
      };
    }

    return {
      ok: false,
      message: getErrorMessage(error, 'Unable to update category right now.'),
    };
  }
}

export async function deleteExpenseCategoryAction(categoryId: string, _formData: FormData) {
  const session = await requireSession();

  await connectMongoose();

  const deleted = await ExpenseCategoryModel.findOneAndDelete({
    _id: new Types.ObjectId(categoryId),
    userId: new Types.ObjectId(session.user.id),
  });

  if (!deleted) {
    redirect('/expense-categories?error=not_found');
  }

  revalidatePath('/expense-categories');
  redirect('/expense-categories?deleted=1');
}
