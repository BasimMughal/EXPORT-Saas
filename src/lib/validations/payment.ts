import { z } from 'zod';

export const PAYMENT_METHODS = [
  'bank_transfer',
  'wise',
  'western_union',
  'cash',
  'other',
] as const;

export const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  bank_transfer: 'Bank Transfer',
  wise: 'Wise',
  western_union: 'Western Union',
  cash: 'Cash',
  other: 'Other',
};

export const paymentSchema = z.object({
  orderId: z.string().trim().min(1, 'Order is required'),
  amount: z.coerce.number().positive('Payment amount must be greater than zero'),
  paymentDate: z.coerce.date(),
  method: z.enum(PAYMENT_METHODS),
  referenceNumber: z.string().trim().max(120).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
});

export const paymentFiltersSchema = z.object({
  q: z.string().trim().max(200).optional().default(''),
  orderId: z.string().trim().optional().default(''),
  method: z.enum(['', ...PAYMENT_METHODS]).default(''),
  sort: z.enum(['paymentDate', 'amount', 'method', 'createdAt']).default('paymentDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaymentValues = z.infer<typeof paymentSchema>;
export type PaymentFilterValues = z.infer<typeof paymentFiltersSchema>;
