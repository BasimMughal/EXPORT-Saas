'use server';

import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { Types } from 'mongoose';

import { requireSession } from '@/lib/auth/session';
import { getErrorMessage } from '@/lib/errors';
import { connectMongoose } from '@/lib/db/mongoose';
import { generateOrderNumber } from '@/lib/orders/order-number';
import { customerSchema, type CustomerValues } from '@/lib/validations/customer';
import { orderDetailsSchema, orderSchema, type OrderValues } from '@/lib/validations/order';
import { CustomerModel } from '@/models/customer.model';
import { OrderModel } from '@/models/order.model';
import { PaymentModel } from '@/models/payment.model';
import { ExpenseModel } from '@/models/expense.model';

type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof OrderValues, string>>;
  customerFieldErrors?: Partial<Record<keyof CustomerValues, string>>;
};

const initialState: ActionState = {
  ok: false,
  message: '',
};

type CustomerSelection =
  { kind: 'existing'; customerId: string } | { kind: 'new'; values: CustomerValues };

type OrderDetails = Omit<OrderValues, 'customerId'>;

type OrderSubmission =
  | { ok: true; details: OrderDetails; customer: CustomerSelection }
  | { ok: false; state: ActionState };

function parseFormData(formData: FormData) {
  return {
    productName: formData.get('productName'),
    quantity: formData.get('quantity'),
    orderValue: formData.get('orderValue'),
    currency: formData.get('currency') || 'PKR',
    orderDate: formData.get('orderDate'),
    deliveryDate: formData.get('deliveryDate'),
    status: formData.get('status') ?? undefined,
    notes: formData.get('notes'),
  };
}

function buildFieldErrors(errors: Record<string, string[] | undefined>) {
  return {
    productName: errors.productName?.[0],
    quantity: errors.quantity?.[0],
    orderValue: errors.orderValue?.[0],
    currency: errors.currency?.[0],
    orderDate: errors.orderDate?.[0],
    deliveryDate: errors.deliveryDate?.[0],
    status: errors.status?.[0],
    notes: errors.notes?.[0],
  };
}

/** Inline "new customer" fields submitted with the order form. */
function parseNewCustomerFormData(formData: FormData) {
  return {
    name: formData.get('customerName') ?? '',
    company: formData.get('customerCompany') ?? '',
    country: formData.get('customerCountry') ?? '',
    phone: formData.get('customerPhone') ?? '',
    email: formData.get('customerEmail') ?? '',
    notes: '',
  };
}

function buildCustomerFieldErrors(errors: Record<string, string[] | undefined>) {
  return {
    name: errors.name?.[0],
    company: errors.company?.[0],
    country: errors.country?.[0],
    phone: errors.phone?.[0],
    email: errors.email?.[0],
  };
}

function parseOrderSubmission(formData: FormData): OrderSubmission {
  const details = orderDetailsSchema.safeParse(parseFormData(formData));
  const isNewCustomer = formData.get('customerMode') === 'new';

  let customer: CustomerSelection | null = null;
  let fieldErrors: ActionState['fieldErrors'];
  let customerFieldErrors: ActionState['customerFieldErrors'];

  if (isNewCustomer) {
    const parsedCustomer = customerSchema.safeParse(parseNewCustomerFormData(formData));
    if (parsedCustomer.success) {
      customer = { kind: 'new', values: parsedCustomer.data };
    } else {
      customerFieldErrors = buildCustomerFieldErrors(parsedCustomer.error.flatten().fieldErrors);
    }
  } else {
    const parsedCustomerId = orderSchema.shape.customerId.safeParse(
      formData.get('customerId') ?? '',
    );
    if (parsedCustomerId.success) {
      customer = { kind: 'existing', customerId: parsedCustomerId.data };
    } else {
      fieldErrors = { customerId: parsedCustomerId.error.flatten().formErrors[0] };
    }
  }

  if (!details.success) {
    fieldErrors = { ...fieldErrors, ...buildFieldErrors(details.error.flatten().fieldErrors) };
  }

  if (!details.success || !customer) {
    return {
      ok: false,
      state: {
        ok: false,
        message: 'Please fix the highlighted fields.',
        fieldErrors,
        customerFieldErrors,
      },
    };
  }

  return { ok: true, details: details.data, customer };
}

/**
 * Returns the customer the order belongs to, creating it first when the user
 * entered a new customer inline. `created` lets the caller roll it back if the
 * order itself fails to save.
 */
async function resolveOrderCustomer(selection: CustomerSelection, userObjectId: Types.ObjectId) {
  if (selection.kind === 'new') {
    const customer = await CustomerModel.create({ userId: userObjectId, ...selection.values });
    return { id: customer._id as Types.ObjectId, created: true };
  }

  const customer = await CustomerModel.findOne({
    _id: new Types.ObjectId(selection.customerId),
    userId: userObjectId,
  })
    .select('_id')
    .lean();

  return customer ? { id: new Types.ObjectId(selection.customerId), created: false } : null;
}

async function rollbackCreatedCustomer(
  customer: { id: Types.ObjectId; created: boolean },
  userObjectId: Types.ObjectId,
) {
  if (customer.created) {
    await CustomerModel.deleteOne({ _id: customer.id, userId: userObjectId });
  }
}

const customerNotFoundState: ActionState = {
  ok: false,
  message: 'Selected customer was not found.',
  fieldErrors: {
    customerId: 'Selected customer was not found.',
  },
};

function toOrderFields(details: OrderDetails, customerId: Types.ObjectId) {
  return {
    customerId,
    productName: details.productName,
    quantity: details.quantity,
    orderValue: details.orderValue,
    currency: details.currency,
    orderDate: details.orderDate,
    deliveryDate: details.deliveryDate ?? null,
    status: details.status,
    notes: details.notes ?? '',
  };
}

export async function createOrderAction(_: ActionState = initialState, formData: FormData) {
  try {
    const session = await requireSession();
    const submission = parseOrderSubmission(formData);

    if (!submission.ok) {
      return submission.state;
    }

    await connectMongoose();

    const userObjectId = new Types.ObjectId(session.user.id);
    const customer = await resolveOrderCustomer(submission.customer, userObjectId);
    if (!customer) {
      return customerNotFoundState;
    }

    try {
      const orderNumber = await generateOrderNumber(session.user.id);
      await OrderModel.create({
        userId: userObjectId,
        orderNumber,
        ...toOrderFields(submission.details, customer.id),
      });
    } catch (error) {
      await rollbackCreatedCustomer(customer, userObjectId);
      throw error;
    }

    revalidatePath('/orders');
    revalidatePath('/customers');
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

export async function updateOrderAction(
  orderId: string,
  _: ActionState = initialState,
  formData: FormData,
) {
  try {
    const session = await requireSession();
    const submission = parseOrderSubmission(formData);

    if (!submission.ok) {
      return submission.state;
    }

    await connectMongoose();

    const userObjectId = new Types.ObjectId(session.user.id);
    const orderFilter = { _id: new Types.ObjectId(orderId), userId: userObjectId };

    // Check the order first so a new customer is never created for a missing order.
    if (!(await OrderModel.exists(orderFilter))) {
      return {
        ok: false,
        message: 'Order not found.',
      };
    }

    const customer = await resolveOrderCustomer(submission.customer, userObjectId);
    if (!customer) {
      return customerNotFoundState;
    }

    try {
      const fields = toOrderFields(submission.details, customer.id);
      // The edit form doesn't send a status (it's changed from the Actions menu), so leave the
      // stored one alone rather than falling back to the schema default.
      const { status: _status, ...fieldsWithoutStatus } = fields;
      await OrderModel.updateOne(orderFilter, {
        $set: formData.has('status') ? fields : fieldsWithoutStatus,
      });
    } catch (error) {
      await rollbackCreatedCustomer(customer, userObjectId);
      throw error;
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/customers');
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

export type OrderStatusActionResult = {
  ok: boolean;
  message: string;
};

const STATUS_LABELS: Record<OrderValues['status'], string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

/** Changes only an order's status, e.g. from the order page's Actions menu. */
export async function updateOrderStatusAction(
  orderId: string,
  status: string,
): Promise<OrderStatusActionResult> {
  const session = await requireSession();

  const parsedStatus = orderSchema.shape.status.safeParse(status);
  if (!parsedStatus.success || !Types.ObjectId.isValid(orderId)) {
    return { ok: false, message: 'Invalid order status.' };
  }

  await connectMongoose();
  const result = await OrderModel.updateOne(
    { _id: new Types.ObjectId(orderId), userId: new Types.ObjectId(session.user.id) },
    { $set: { status: parsedStatus.data } },
  );
  if (result.matchedCount === 0) {
    return { ok: false, message: 'Order not found.' };
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}/edit`);
  revalidatePath('/dashboard');
  revalidatePath('/reports');
  return { ok: true, message: `Status changed to ${STATUS_LABELS[parsedStatus.data]}.` };
}
