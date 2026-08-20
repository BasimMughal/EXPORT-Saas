import { Schema, model, models, type InferSchemaType } from 'mongoose';

import { CURRENCY_CODES, DEFAULT_CURRENCY } from '@/config/currency';
import { ORDER_STATUSES } from '@/lib/validations/order';

const OrderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    orderValue: {
      type: Number,
      required: true,
      min: 0,
    },
    /** @deprecated Use payments module. Kept for migration reads only. */
    receivedAmount: {
      type: Number,
      min: 0,
      default: undefined,
    },
    currency: {
      type: String,
      enum: [...CURRENCY_CODES],
      default: DEFAULT_CURRENCY,
      required: true,
      index: true,
    },
    orderDate: {
      type: Date,
      required: true,
      index: true,
    },
    deliveryDate: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'orders',
  },
);

OrderSchema.index({ userId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, customerId: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, orderDate: -1 });
OrderSchema.index({ userId: 1, deliveryDate: -1 });
OrderSchema.index({
  orderNumber: 'text',
  productName: 'text',
  description: 'text',
  notes: 'text',
});

export type OrderDocument = InferSchemaType<typeof OrderSchema> & {
  _id: Schema.Types.ObjectId;
};

export const OrderModel = models.Order || model('Order', OrderSchema);
