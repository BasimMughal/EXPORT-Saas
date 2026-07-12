import { z } from 'zod';

const optionalText = z.string().trim().max(500, 'Must be 500 characters or fewer').optional();

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  company: z.string().trim().max(120).optional().default(''),
  country: z.string().trim().min(2, 'Country is required').max(80),
  phone: z.string().trim().max(40).optional().default(''),
  email: z
    .string()
    .trim()
    .max(320)
    .refine((value) => value.length === 0 || z.string().email().safeParse(value).success, {
      message: 'Enter a valid email address',
    })
    .optional()
    .default(''),
  notes: optionalText.default(''),
});

export const customerFiltersSchema = z.object({
  q: z.string().trim().max(200).optional().default(''),
  country: z.string().trim().max(80).optional().default(''),
  sort: z.enum(['createdAt', 'name', 'company', 'country', 'email']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CustomerValues = z.infer<typeof customerSchema>;
export type CustomerFilterValues = z.infer<typeof customerFiltersSchema>;
