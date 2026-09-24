import { Schema, model, models, type InferSchemaType } from 'mongoose';

import { CURRENCY_CODES } from '@/config/currency';
import { PAYMENT_METHODS } from '@/lib/validations/payment';

const PaymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    /**
     * Set when the amount was entered in another currency and converted into the order
     * currency: what was actually paid, and the rate used (units of originalCurrency per
     * 1 unit of the order currency). `amount` is always the converted, order-currency value.
     */
    originalAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    originalCurrency: {
      type: String,
      enum: [...CURRENCY_CODES, null],
      default: null,
    },
    exchangeRate: {
      type: Number,
      min: 0,
      default: null,
    },
    paymentDate: {
      type: Date,
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
      index: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'payments',
  },
);

PaymentSchema.index({ userId: 1, orderId: 1, paymentDate: -1 });
PaymentSchema.index({ userId: 1, paymentDate: -1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });

export type PaymentDocument = InferSchemaType<typeof PaymentSchema> & {
  _id: Schema.Types.ObjectId;
};

export const PaymentModel = models.Payment || model('Payment', PaymentSchema);
