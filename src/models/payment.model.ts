import { Schema, model, models, type InferSchemaType } from 'mongoose';

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
