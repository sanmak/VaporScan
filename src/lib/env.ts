/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { z } from 'zod';
import { logger } from './logger';

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_GITHUB_REPO: z.string().url().default('https://github.com/sanmak/VaporScan'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.enum(['true', 'false']).default('false'),
  NEXT_PUBLIC_SEO_ADVANCED: z.enum(['true', 'false']).default('false'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = envSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_GITHUB_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO,
  NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  NEXT_PUBLIC_SEO_ADVANCED: process.env.NEXT_PUBLIC_SEO_ADVANCED,
  NODE_ENV: process.env.NODE_ENV,
});

if (!_env.success) {
  logger.error('Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
