/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { MetadataRoute } from 'next';
import { config } from '@/config';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = config.app.url;
  const isAdvancedSEO = config.app.isAdvancedSEO;

  if (!isAdvancedSEO) {
    return {
      rules: {
        userAgent: '*',
        disallow: '',
      },
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/static/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
