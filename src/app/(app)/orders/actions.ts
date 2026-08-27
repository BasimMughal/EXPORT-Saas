'use server';

import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { Types } from 'mongoose';

import { requireSession } from '@/lib/auth/session';
import { getErrorMessage } from '@/lib/errors';
import { connectMongoose } from '@/lib/db/mongoose';
import { generateOrderNumber } from '@/lib/orders/order-number';
import { customerSchema, type CustomerValues } from '@/lib/validations/customer';
import { orderSchema, type OrderValues } from '@/lib/validations/order';
import { CustomerModel } from '@/models/customer.model';
import { OrderModel } from '@/models/order.model';
import { PaymentModel } from '@/models/payment.model';
import { ExpenseModel } from '@/models/expense.model';

type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof OrderValues, string>>;
};

const initialState: ActionState = {
  ok: false,
  message: '',
};

type CustomerQuickCreateState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof CustomerValues, string>>;
  customer?: {
    id: string;
    label: string;
  };
};

function parseFormData(formData: FormData) {
  return {
    customerId: formData.get('customerId'),
    productName: formData.get('productName'),
    description: formData.get('description'),
    quantity: formData.get('quantity'),
    orderValue: formData.get('orderValue'),
    currency: formData.get('currency') || 'PKR',
    orderDate: formData.get('orderDate'),
    deliveryDate: formData.get('deliveryDate'),
    status: formData.get('status'),
    notes: formData.get('notes'),
  };
}

function buildFieldErrors(errors: Record<string, string[] | undefined>) {
  return {
    customerId: errors.customerId?.[0],
    productName: errors.productName?.[0],
    description: errors.description?.[0],
    quantity: errors.quantity?.[0],
    orderValue: errors.orderValue?.[0],
    currency: errors.currency?.[0],
    orderDate: errors.orderDate?.[0],
    deliveryDate: errors.deliveryDate?.[0],
    status: errors.status?.[0],
    notes: errors.notes?.[0],
  };
}

function parseCustomerFormData(formData: FormData) {
  return {
    name: formData.get('name'),
    company: formData.get('company'),
    country: formData.get('country'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    notes: formData.get('notes'),
  };
}

function buildCustomerFieldErrors(errors: Record<string, string[] | undefined>) {
  return {
    name: errors.name?.[0],
    company: errors.company?.[0],
    country: errors.country?.[0],
    phone: errors.phone?.[0],
    email: errors.email?.[0],
    notes: errors.notes?.[0],
  };
}

async function verifyCustomerOwnership(customerId: string, userId: string) {
  const customer = await CustomerModel.findOne({
    _id: new Types.ObjectId(customerId),
    userId: new Types.ObjectId(userId),
  })
    .select('_id')
    .lean();

  return Boolean(customer);
}

export async function createOrderAction(_: ActionState = initialState, formData: FormData) {
  try {
    const session = await requireSession();
    const parsed = orderSchema.safeParse(parseFormData(formData));

    if (!parsed.success) {
      return {
        ok: false,
        message: 'Please fix the highlighted fields.',
        fieldErrors: buildFieldErrors(parsed.error.flatten().fieldErrors),
      };
    }

    await connectMongoose();

    const hasCustomer = await verifyCustomerOwnership(parsed.data.customerId, session.user.id);
    if (!hasCustomer) {
      return {
        ok: false,
        message: 'Selected customer was not found.',
        fieldErrors: {
          customerId: 'Selected customer was not found.',
        },
      };
    }

    const orderNumber = await generateOrderNumber(session.user.id);

    await OrderModel.create({
      userId: new Types.ObjectId(session.user.id),
      customerId: new Types.ObjectId(parsed.data.customerId),
      orderNumber,
      productName: parsed.data.productName,
      description: parsed.data.description ?? '',
      quantity: parsed.data.quantity,
      orderValue: parsed.data.orderValue,
      currency: parsed.data.currency,
      orderDate: parsed.data.orderDate,
      deliveryDate: parsed.data.deliveryDate ?? null,
      status: parsed.data.status,
      notes: parsed.data.notes ?? '',
    });

    revalidatePath('/orders');
    revalidatePath('/dashboard');
    revalidatePath('/payments');
    redirect('/orders?created=1');
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false,
      message: getErrorMessage(error, 'Unable to create order right now.'),
    };
  }
}

export async function createCustomerForOrderAction(
  _: CustomerQuickCreateState,
  formData: FormData,
): Promise<CustomerQuickCreateState> {
  try {
    const session = await requireSession();
    const parsed = customerSchema.safeParse(parseCustomerFormData(formData));

    if (!parsed.success) {
      return {
        ok: false,
        message: 'Please fix the highlighted customer fields.',
        fieldErrors: buildCustomerFieldErrors(parsed.error.flatten().fieldErrors),
      };
    }

    await connectMongoose();

    const customer = await CustomerModel.create({
      userId: new Types.ObjectId(session.user.id),
      ...parsed.data,
    });

    const label = parsed.data.company
      ? `${parsed.data.name} - ${parsed.data.company}`
      : parsed.data.name;

    revalidatePath('/customers');
    revalidatePath('/orders');
    revalidatePath('/orders/new');
    revalidatePath('/dashboard');

    return {
      ok: true,
      message: 'Customer created.',
      customer: {
        id: customer._id.toString(),
        label,
      },
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false,
      message: getErrorMessage(error, 'Unable to create customer right now.'),
    };
  }
}

export async function updateOrderAction(
  orderId: string,
  _: ActionState = initialState,
  formData: FormData,
) {
  try {
    const session = await requireSession();
    const parsed = orderSchema.safeParse(parseFormData(formData));

    if (!parsed.success) {
      return {
        ok: false,
        message: 'Please fix the highlighted fields.',
        fieldErrors: buildFieldErrors(parsed.error.flatten().fieldErrors),
      };
    }

    await connectMongoose();

    const hasCustomer = await verifyCustomerOwnership(parsed.data.customerId, session.user.id);
    if (!hasCustomer) {
      return {
        ok: false,
        message: 'Selected customer was not found.',
        fieldErrors: {
          customerId: 'Selected customer was not found.',
        },
      };
    }

    const updated = await OrderModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(session.user.id),
      },
      {
        $set: {
          customerId: new Types.ObjectId(parsed.data.customerId),
          productName: parsed.data.productName,
          description: parsed.data.description ?? '',
          quantity: parsed.data.quantity,
          orderValue: parsed.data.orderValue,
          currency: parsed.data.currency,
          orderDate: parsed.data.orderDate,
          deliveryDate: parsed.data.deliveryDate ?? null,
          status: parsed.data.status,
          notes: parsed.data.notes ?? '',
        },
      },
      { new: true },
    );

    if (!updated) {
      return {
        ok: false,
        message: 'Order not found.',
      };
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/dashboard');
    revalidatePath('/payments');
    redirect('/orders?updated=1');
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false,
      message: getErrorMessage(error, 'Unable to update order right now.'),
    };
  }
}

export async function deleteOrderAction(orderId: string, _formData: FormData) {
  const session = await requireSession();
  const userObjectId = new Types.ObjectId(session.user.id);
  const orderObjectId = new Types.ObjectId(orderId);

  await connectMongoose();
  const deleted = await OrderModel.findOneAndDelete({
    _id: orderObjectId,
    userId: userObjectId,
  });

  if (!deleted) {
    redirect('/orders?error=not_found');
  }

  await Promise.all([
    PaymentModel.deleteMany({ orderId: orderObjectId, userId: userObjectId }),
    ExpenseModel.updateMany(
      { orderId: orderObjectId, userId: userObjectId },
      { $set: { orderId: null } },
    ),
  ]);

  revalidatePath('/orders');
  revalidatePath('/payments');
  revalidatePath('/expenses');
  revalidatePath('/dashboard');
  redirect('/orders?deleted=1');
}
