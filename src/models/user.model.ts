import { Schema, model, models, type InferSchemaType } from 'mongoose';

const UserSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'disabled'],
      default: 'active',
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    preferredCurrency: {
      type: String,
      enum: ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'CNY', 'TRY', 'INR'],
      default: 'PKR',
      required: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
      index: true,
    },
    /**
     * Profile photo, stored as a small (≈256px) image. Kept out of normal queries because of
     * its size; `avatarUpdatedAt` tells whether one exists and versions its URL for caching.
     */
    avatar: {
      type: {
        data: { type: Buffer, required: true },
        contentType: {
          type: String,
          enum: ['image/jpeg', 'image/png', 'image/webp'],
          required: true,
        },
      },
      default: null,
      select: false,
    },
    avatarUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

UserSchema.index({ createdAt: -1 });
UserSchema.index({ email: 1, createdAt: -1 });

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: Schema.Types.ObjectId;
  passwordHash: string;
};

export const UserModel = models.User || model('User', UserSchema);
