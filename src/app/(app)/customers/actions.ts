'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Types } from 'mongoose';

import { requireSession } from '@/lib/auth/session';
import { getErrorMessage } from '@/lib/errors';
import { connectMongoose } from '@/lib/db/mongoose';
import { customerSchema, type CustomerValues } from '@/lib/validations/customer';
import { CustomerModel } from '@/models/customer.model';

type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof CustomerValues, string>>;
};

const initialState: ActionState = {
  ok: false,
  message: '',
};

function parseFormData(formData: FormData) {
  return {
    name: formData.get('name'),
    company: formData.get('company'),
    country: formData.get('country'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    notes: formData.get('notes'),
  };
}

export async function createCustomerAction(_: ActionState = initialState, formData: FormData) {
  try {
    const session = await requireSession();
    const parsed = customerSchema.safeParse(parseFormData(formData));

    if (!parsed.success) {
      return {
        ok: false,
        message: 'Please fix the highlighted fields.',
        fieldErrors: {
          name: parsed.error.flatten().fieldErrors.name?.[0],
          company: parsed.error.flatten().fieldErrors.company?.[0],
          country: parsed.error.flatten().fieldErrors.country?.[0],
          phone: parsed.error.flatten().fieldErrors.phone?.[0],
          email: parsed.error.flatten().fieldErrors.email?.[0],
          notes: parsed.error.flatten().fieldErrors.notes?.[0],
        },
      };
    }

    await connectMongoose();
    await CustomerModel.create({
      userId: new Types.ObjectId(session.user.id),
      ...parsed.data,
    });

    revalidatePath('/customers');
    redirect('/customers?created=1');
  } catch (error) {
    return {
      ok: false,
      message: getErrorMessage(error, 'Unable to create customer right now.'),
    };
  }
}

export async function updateCustomerAction(customerId: string, _: ActionState = initialState, formData: FormData) {
  try {
    const session = await requireSession();
    const parsed = customerSchema.safeParse(parseFormData(formData));

    if (!parsed.success) {
      return {
        ok: false,
        message: 'Please fix the highlighted fields.',
        fieldErrors: {
          name: parsed.error.flatten().fieldErrors.name?.[0],
          company: parsed.error.flatten().fieldErrors.company?.[0],
          country: parsed.error.flatten().fieldErrors.country?.[0],
          phone: parsed.error.flatten().fieldErrors.phone?.[0],
          email: parsed.error.flatten().fieldErrors.email?.[0],
          notes: parsed.error.flatten().fieldErrors.notes?.[0],
        },
      };
    }

    await connectMongoose();
    const updated = await CustomerModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(customerId),
        userId: new Types.ObjectId(session.user.id),
      },
      {
        $set: parsed.data,
      },
      { new: true },
    );

    if (!updated) {
      return {
        ok: false,
        message: 'Customer not found.',
      };
    }

    revalidatePath('/customers');
    redirect('/customers?updated=1');
  } catch (error) {
    return {
      ok: false,
      message: getErrorMessage(error, 'Unable to update customer right now.'),
    };
  }
}

export async function deleteCustomerAction(customerId: string) {
  try {
    const session = await requireSession();

    await connectMongoose();
    const deleted = await CustomerModel.findOneAndDelete({
      _id: new Types.ObjectId(customerId),
      userId: new Types.ObjectId(session.user.id),
    });

    if (!deleted) {
      return {
        ok: false,
        message: 'Customer not found.',
      };
    }

    revalidatePath('/customers');
    redirect('/customers?deleted=1');
  } catch (error) {
    return {
      ok: false,
      message: getErrorMessage(error, 'Unable to delete customer right now.'),
    };
  }
}
