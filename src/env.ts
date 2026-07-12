import 'server-only';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  AUTH_TRUST_HOST: z.coerce.boolean().optional(),
  AUTH_URL: z.string().url().optional(),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB: z.string().min(1).default('export_management_saas'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Export Management'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);
