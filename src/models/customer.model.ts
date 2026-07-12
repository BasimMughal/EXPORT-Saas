import { Schema, model, models, type InferSchemaType } from 'mongoose';

const CustomerSchema = new Schema(
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
    company: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
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
    collection: 'customers',
  },
);

CustomerSchema.index({ userId: 1, createdAt: -1 });
CustomerSchema.index({ userId: 1, country: 1, createdAt: -1 });
CustomerSchema.index({ userId: 1, name: 1 });
CustomerSchema.index({ userId: 1, company: 1 });
CustomerSchema.index({ userId: 1, email: 1 });
CustomerSchema.index({ userId: 1, phone: 1 });
CustomerSchema.index({
  name: 'text',
  company: 'text',
  country: 'text',
  phone: 'text',
  email: 'text',
  notes: 'text',
});

export type CustomerDocument = InferSchemaType<typeof CustomerSchema> & {
  _id: Schema.Types.ObjectId;
};

export const CustomerModel = models.Customer || model('Customer', CustomerSchema);
