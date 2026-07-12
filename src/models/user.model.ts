import { Schema, model, models, type InferSchemaType } from 'mongoose';

import { ROLES, type Role } from '@/lib/auth/authorization';

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
    role: {
      type: String,
      enum: ROLES,
      default: 'viewer',
      required: true,
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
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: Schema.Types.ObjectId;
  role: Role;
  passwordHash: string;
};

export const UserModel = models.User || model('User', UserSchema);
