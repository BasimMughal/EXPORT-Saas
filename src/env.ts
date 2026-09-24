import 'server-only';

import { z } from 'zod';

/** The placeholder shipped in .env.example; never valid as a real secret. */
const EXAMPLE_AUTH_SECRET = 'replace_with_a_secure_random_string';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Signs every session token: with a guessable secret anyone could forge a login as any user.
  // Production refuses to start without a strong one (generate with `npx auth secret`).
  AUTH_SECRET: z
    .string()
    .min(1, 'AUTH_SECRET is required')
    .refine(
      (value) =>
        process.env.NODE_ENV !== 'production' ||
        (value.length >= 32 && value !== EXAMPLE_AUTH_SECRET),
      'AUTH_SECRET must be a random value of at least 32 characters in production.',
    ),
  AUTH_TRUST_HOST: z.coerce.boolean().optional(),
  AUTH_URL: z.string().url().optional(),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB: z.string().min(1).default('export_management_saas'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Export Management'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);
