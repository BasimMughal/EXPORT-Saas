import { z } from 'zod';

import { CURRENCY_CODES } from '@/config/currency';

export const expenseSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(160),
  amount: z.coerce.number().min(0, 'Amount must be 0 or greater'),
  currency: z.enum(CURRENCY_CODES).default('PKR'),
  categoryId: z.string().min(1, 'Select a category'),
  orderId: z.string().optional().or(z.literal('')),
  expenseDate: z.string().min(1, 'Expense date is required'),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const expenseFiltersSchema = z.object({
  q: z.string().trim().default(''),
  categoryId: z.string().trim().default(''),
  orderId: z.string().trim().default(''),
  currency: z.enum(['', ...CURRENCY_CODES]).default(''),
  from: z.string().trim().default(''),
  to: z.string().trim().default(''),
  sort: z.enum(['expenseDate', 'amount', 'title', 'createdAt']).default('expenseDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(100).default(10),
});

export type ExpenseValues = z.infer<typeof expenseSchema>;
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;
