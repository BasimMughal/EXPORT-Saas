import { Schema, model, models, type InferSchemaType } from 'mongoose';

const ExpenseCategorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    nameNormalized: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'expense_categories',
  },
);

ExpenseCategorySchema.index({ userId: 1, nameNormalized: 1 }, { unique: true });
ExpenseCategorySchema.index({ userId: 1, createdAt: -1 });
ExpenseCategorySchema.index({ userId: 1, name: 1 });
ExpenseCategorySchema.index({
  name: 'text',
});

export type ExpenseCategoryDocument = InferSchemaType<typeof ExpenseCategorySchema> & {
  _id: Schema.Types.ObjectId;
};

export const ExpenseCategoryModel =
  models.ExpenseCategory || model('ExpenseCategory', ExpenseCategorySchema);
