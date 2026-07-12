import { z } from 'zod';

export const expenseCategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters').max(80),
});

export const expenseCategoryFiltersSchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
});

export type ExpenseCategoryValues = z.infer<typeof expenseCategorySchema>;
