import { Schema, model, models, type InferSchemaType } from 'mongoose';

import { CURRENCY_CODES, DEFAULT_CURRENCY } from '@/config/currency';

const ExpenseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: [...CURRENCY_CODES],
      default: DEFAULT_CURRENCY,
      required: true,
      index: true,
    },
    expenseDate: {
      type: Date,
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
    collection: 'expenses',
  },
);

ExpenseSchema.index({ userId: 1, expenseDate: -1 });
ExpenseSchema.index({ userId: 1, categoryId: 1, expenseDate: -1 });
ExpenseSchema.index({ userId: 1, orderId: 1, expenseDate: -1 });
ExpenseSchema.index({ userId: 1, createdAt: -1 });
ExpenseSchema.index({
  title: 'text',
  notes: 'text',
});

export type ExpenseDocument = InferSchemaType<typeof ExpenseSchema> & {
  _id: Schema.Types.ObjectId;
};

export const ExpenseModel = models.Expense || model('Expense', ExpenseSchema);
