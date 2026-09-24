import { z } from 'zod';
import { Types } from 'mongoose';

import { CURRENCY_CODES } from '@/config/currency';
import { filterDateSchema } from '@/lib/filters/date-range';

export const ORDER_STATUSES = ['pending', 'in_progress', 'completed', 'abandoned'] as const;

const optionalText = z
  .string()
  .trim()
  .max(1000, 'Must be 1000 characters or fewer')
  .optional()
  .default('');

const optionalDate = z.preprocess((value) => {
  if (value === '' || value == null) {
    return undefined;
  }

  return value;
}, z.coerce.date().optional());

export const orderSchema = z.object({
  customerId: z
    .string()
    .trim()
    .min(1, 'Customer is required')
    .refine((value) => Types.ObjectId.isValid(value), 'Select a valid customer'),
  productName: z.string().trim().min(2, 'Product name must be at least 2 characters').max(150),
  quantity: z.coerce
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1'),
  orderValue: z.coerce.number().min(0, 'Order value cannot be negative'),
  currency: z.enum(CURRENCY_CODES).default('PKR'),
  orderDate: z.coerce.date(),
  deliveryDate: optionalDate,
  status: z.enum(ORDER_STATUSES).default('pending'),
  notes: optionalText,
});

/** Order fields without the customer — used when the customer is created inline with the order. */
export const orderDetailsSchema = orderSchema.omit({ customerId: true });

export const orderFiltersSchema = z.object({
  q: z.string().trim().max(200).optional().default(''),
  status: z.enum(['', ...ORDER_STATUSES]).default(''),
  customerId: z.string().trim().optional().default(''),
  currency: z.enum(['', ...CURRENCY_CODES]).default(''),
  /** Order date range, inclusive. */
  from: filterDateSchema,
  to: filterDateSchema,
  sort: z
    .enum([
      'orderNumber',
      'productName',
      'quantity',
      'orderValue',
      'orderDate',
      'deliveryDate',
      'status',
      'createdAt',
    ])
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type OrderValues = z.infer<typeof orderSchema>;
export type OrderFilterValues = z.infer<typeof orderFiltersSchema>;
