/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { env } from '@/lib/env';

export const config = {
  app: {
    name: 'VaporScan',
    description: 'An open-source, client-side SEO auditing tool',
    url: env.NEXT_PUBLIC_APP_URL,
    githubRepo: env.NEXT_PUBLIC_GITHUB_REPO,
    enableAnalytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    isAdvancedSEO: env.NEXT_PUBLIC_SEO_ADVANCED === 'true',
  },
  crawler: {
    defaultConcurrency: 5,
    defaultMaxDepth: 10,
    defaultMaxPages: 1000,
    defaultTimeout: 10000,
    defaultUserAgent: 'VaporScan/1.0',
  },
  storage: {
    dbName: 'vaporscan',
    dbVersion: 1,
    objectStores: {
      crawls: 'crawls',
      pages: 'pages',
      reports: 'reports',
    },
  },
} as const;

export default config;
